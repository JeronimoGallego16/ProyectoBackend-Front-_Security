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
import { RoleRequestDTO } from 'src/app/models/dtos/role-request.dto';
import { Role } from 'src/app/models/role.model';
import { RoleService } from 'src/app/services/role.service';

/**
 * Presentation layer page that orchestrates the full CRUD lifecycle of the
 * security `Role` entity. It delegates every backend interaction to the
 * {@link RoleService} and renders the collection through the generic
 * {@link DataTableComponent}.
 */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
  /**
   * Column definition consumed by the generic data table.
   */
  public columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
  ];

  public fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Role name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      placeholder: 'Role description',
    },
  ];

  public roles: Role[] = [];
  public roleForm: FormGroup; // Reactive form used to create and update roles.
  public showForm = false; // Flag that controls whether the creation/edition form is visible.
  public isEditing = false; // Flag that indicates whether an edition is in progress
  public isLoading = false; // Flag that indicates whether an HTTP operation is currently running.
  private editingRoleId: number | null = null;

  /**
   * Creates an instance of the roles page.
   *
   * @param formBuilder - Angular service used to build the reactive form.
   * @param roleService - Service that provides role data access.
   * @param snackBar - Angular Material service used to show user feedback.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly roleService: RoleService,
    private readonly snackBar: MatSnackBar
  ) {
    this.roleForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  /**
   * Lifecycle hook that loads the role collection on component initialization.
   */
  public ngOnInit(): void {
    this.loadRoles();
  }

  /**
   * Fetches every role from the backend and refreshes the table data.
   */
  public loadRoles(): void {
    this.isLoading = true;
    this.roleService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (roles: Role[]) => (this.roles = roles),
        error: () => this.showMessage('Could not load roles. Please try again.'),
      });
  }

  /**
   * Opens the form in creation mode with an empty payload.
   */
  public onCreateClick(): void {
    this.isEditing = false;
    this.editingRoleId = null;
    this.roleForm.reset({ name: '', description: '' });
    this.showForm = true;
  }

  /**
   * Opens the form in edition mode, preloading the selected role data.
   *
   * @param role - Role selected from the table.
   */
  public onEdit(role: Role): void {
    this.isEditing = true;
    this.editingRoleId = role.id;
    this.roleForm.reset({
      name: role.name,
      description: role.description,
    });
    this.showForm = true;
  }

  /**
   * Displays the details of the selected role through a notification.
   *
   * @param role - Role selected from the table.
   */
  public onView(role: Role): void {
    this.showMessage(`Role #${role.id}: ${role.name} - ${role.description}`);
  }

  /**
   * Removes the selected role after user confirmation and refreshes the table.
   *
   * @param role - Role selected from the table.
   */
  public onDelete(role: Role): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete the role "${role.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.roleService
      .delete(role.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.showMessage('Role deleted successfully.');
          this.loadRoles();
        },
        error: () => this.showMessage('Could not delete the role.'),
      });
  }

  /**
   * Handles form submission, creating or updating a role depending on the
   * current mode.
   */
  public onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const payload: RoleRequestDTO = this.buildPayload();
    this.isLoading = true;

    const request$ =
      this.isEditing && this.editingRoleId !== null
        ? this.roleService.update(this.editingRoleId, payload)
        : this.roleService.create(payload);

    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.showMessage(
          this.isEditing
            ? 'Role updated successfully.'
            : 'Role created successfully.'
        );
        this.cancelForm();
        this.loadRoles();
      },
      error: () =>
        this.showMessage('Could not save the role. Please verify the data.'),
    });
  }

  /**
   * Closes the form and resets its state.
   */
  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingRoleId = null;
    this.roleForm.reset({ name: '', description: '' });
  }

  /**
   * Builds the request payload from the current form values.
   *
   * @returns The DTO with the role data entered by the user.
   */
  private buildPayload(): RoleRequestDTO {
    return {
      name: this.roleForm.value.name as string,
      description: this.roleForm.value.description as string,
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
