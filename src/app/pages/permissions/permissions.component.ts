import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import {
  DataTableComponent,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import { MaterialModule } from 'src/app/material.module';
import { PermissionRequestDTO } from 'src/app/models/dtos/permission-request.dto';
import { Permission } from 'src/app/models/permission.model';
import { PermissionService } from 'src/app/services/permission.service';

/**
 * Presentation layer page that orchestrates the full CRUD lifecycle of the
 * security `Permission` entity. It delegates every backend interaction to the
 * {@link PermissionService} and renders the collection through the generic
 * {@link DataTableComponent}.
 */
@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
  ],
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss'],
})
export class PermissionsComponent implements OnInit {
  /**
   * Column definition consumed by the generic data table.
   */
  public columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'url', header: 'URL' },
    { field: 'method', header: 'Method' },
  ];

  /**
   * Field definition consumed by the generic dynamic form.
   */
  public fields: FormFieldConfig[] = [
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      placeholder: 'Permission URL, e.g. /api/users',
    },
    {
      name: 'method',
      label: 'Method',
      type: 'text',
      placeholder: 'HTTP method, e.g. GET',
    },
  ];

  public permissions: Permission[] = [];
  public permissionForm: FormGroup; // Reactive form used to create and update permissions.
  public showForm = false; // Flag that controls whether the creation/edition form is visible.
  public isEditing = false; // Flag that indicates whether an edition is in progress.
  public isLoading = false; // Flag that indicates whether an HTTP operation is currently running.
  private editingPermissionId: number | null = null;

  /**
   * Creates an instance of the permissions page.
   *
   * @param formBuilder - Angular service used to build the reactive form.
   * @param permissionService - Service that provides permission data access.
   * @param snackBar - Angular Material service used to show user feedback.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly permissionService: PermissionService,
    private readonly snackBar: MatSnackBar
  ) {
    this.permissionForm = this.formBuilder.group({
      url: ['', [Validators.required]],
      method: ['', [Validators.required]],
    });
  }

  /**
   * Lifecycle hook that loads the permission collection on component initialization.
   */
  public ngOnInit(): void {
    this.loadPermissions();
  }

  /**
   * Fetches every permission from the backend and refreshes the table data.
   */
  public loadPermissions(): void {
    this.isLoading = true;
    this.permissionService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (permissions: Permission[]) => (this.permissions = permissions),
        error: () =>
          this.showMessage('Could not load permissions. Please try again.'),
      });
  }

  /**
   * Opens the form in creation mode with an empty payload.
   */
  public onCreateClick(): void {
    this.isEditing = false;
    this.editingPermissionId = null;
    this.permissionForm.reset({ url: '', method: '' });
    this.showForm = true;
  }

  /**
   * Opens the form in edition mode, preloading the selected permission data.
   *
   * @param permission - Permission selected from the table.
   */
  public onEdit(permission: Permission): void {
    this.isEditing = true;
    this.editingPermissionId = permission.id;
    this.permissionForm.reset({
      url: permission.url,
      method: permission.method,
    });
    this.showForm = true;
  }

  /**
   * Displays the details of the selected permission through a notification.
   *
   * @param permission - Permission selected from the table.
   */
  public onView(permission: Permission): void {
    this.showMessage(
      `Permission #${permission.id}: ${permission.method} ${permission.url}`
    );
  }

  /**
   * Removes the selected permission after user confirmation and refreshes the table.
   *
   * @param permission - Permission selected from the table.
   */
  public onDelete(permission: Permission): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete the permission "${permission.method} ${permission.url}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.permissionService
      .delete(permission.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.showMessage('Permission deleted successfully.');
          this.loadPermissions();
        },
        error: () => this.showMessage('Could not delete the permission.'),
      });
  }

  /**
   * Handles form submission, creating or updating a permission depending on the
   * current mode.
   */
  public onSubmit(): void {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    const payload: PermissionRequestDTO = this.buildPayload();
    this.isLoading = true;

    const request$ =
      this.isEditing && this.editingPermissionId !== null
        ? this.permissionService.update(this.editingPermissionId, payload)
        : this.permissionService.create(payload);

    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.showMessage(
          this.isEditing
            ? 'Permission updated successfully.'
            : 'Permission created successfully.'
        );
        this.cancelForm();
        this.loadPermissions();
      },
      error: () =>
        this.showMessage(
          'Could not save the permission. Please verify the data.'
        ),
    });
  }

  /**
   * Closes the form and resets its state.
   */
  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingPermissionId = null;
    this.permissionForm.reset({ url: '', method: '' });
  }

  /**
   * Builds the request payload from the current form values.
   *
   * @returns The DTO with the permission data entered by the user.
   */
  private buildPayload(): PermissionRequestDTO {
    return {
      url: this.permissionForm.value.url as string,
      method: this.permissionForm.value.method as string,
    };
  }

  /**
   * Shows a short notification message to the user.
   *
   * @param message - Text to display in the snack bar.
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
