import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import {
  DataTableComponent,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import { MaterialModule } from 'src/app/material.module';
import { DetailDialogComponent } from 'src/app/components/detail-dialog/detail-dialog.component';
import { PermissionRequestDTO } from 'src/app/models/dtos/permission-request.dto';
import { Permission } from 'src/app/models/permission.model';
import { PermissionService } from 'src/app/services/permission.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { FeedbackCase } from 'src/app/models/feedback-case';

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
    ConfirmDialogComponent,
    DetailDialogComponent,
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
    { field: 'entity', header: 'Entity' },
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
    {
      name: 'entity',
      label: 'Entity',
      type: 'text',
      placeholder: 'Entity name',
    },
  ];

  public permissions: Permission[] = [];
  public permissionForm: FormGroup; // Reactive form used to create and update permissions.
  public showForm = false; // Flag that controls whether the creation/edition form is visible.
  public isEditing = false; // Flag that indicates whether an edition is in progress.
  public isLoading = false; // Flag that indicates whether an HTTP operation is currently running.
  public confirmDeleteOpen = false;
  public pendingDeletePermission: Permission | null = null;
  public detailOpen = false;
  public selectedPermission: Permission | null = null;
  public detailFields = [
    { key: 'id', label: 'ID' },
    { key: 'url', label: 'URL' },
    { key: 'method', label: 'Method' },
    { key: 'entity', label: 'Entity' },
  ];
  private editingPermissionId: number | null = null;

  /**
   * Creates an instance of the permissions page.
   *
   * @param formBuilder - Angular service used to build the reactive form.
   * @param permissionService - Service that provides permission data access.
   * @param feedbackHandlerService - Service that publishes user feedback notifications.
   */
  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly permissionService: PermissionService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.permissionForm = this.formBuilder.group({
      url: ['', [Validators.required]],
      method: ['', [Validators.required]],
      entity: ['', [Validators.required]],
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
        error: (error) =>
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load permissions. Please try again.'),
      });
  }

  /**
   * Opens the form in creation mode with an empty payload.
   */
  public onCreateClick(): void {
    this.isEditing = false;
    this.editingPermissionId = null;
    this.permissionForm.reset({ url: '', method: '', entity: '' });
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
      entity: permission.entity,
    });
    this.showForm = true;
  }

  /**
   * Opens the detail dialog with the selected permission information.
   *
   * @param permission - Permission selected from the table.
   */
  public onView(permission: Permission): void {
    this.selectedPermission = permission;
    this.detailOpen = true;
  }

  public onCloseDetail(): void {
    this.detailOpen = false;
    this.selectedPermission = null;
  }

  /**
   * Removes the selected permission after user confirmation and refreshes the table.
   *
   * @param permission - Permission selected from the table.
   */
  public onDelete(permission: Permission): void {
    this.pendingDeletePermission = permission;
    this.confirmDeleteOpen = true;
  }

  /**
   * Deletes the pending permission after confirmation and refreshes the table.
   */
  public onConfirmDelete(): void {
    if (!this.pendingDeletePermission) {
      return;
    }

    const permission = this.pendingDeletePermission;
    this.isLoading = true;
    this.permissionService
      .delete(permission.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(FeedbackCase.NO_CONTENT, 'Permission deleted successfully.');
          this.confirmDeleteOpen = false;
          this.pendingDeletePermission = null;
          this.loadPermissions();
        },
        error: (error) => {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not delete the permission.');
          this.confirmDeleteOpen = false;
          this.pendingDeletePermission = null;
        },
      });
  }

  /**
   * Cancels the pending permission deletion and informs the user.
   */
  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeletePermission = null;
    this.feedbackHandlerService.info(FeedbackCase.CANCELLED, 'Deletion cancelled.');
  }

  /**
   * Handles form submission, creating or updating a permission depending on the
   * current mode.
   */
  public onSubmit(): void {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      this.feedbackHandlerService.warning(FeedbackCase.BAD_REQUEST, 'Please complete all required fields before saving.');
      return;
    }

    const payload: PermissionRequestDTO = this.buildPayload();
    this.isLoading = true;

    const wasEditing = this.isEditing;
    const request$ =
      this.isEditing && this.editingPermissionId !== null
        ? this.permissionService.update(this.editingPermissionId, payload)
        : this.permissionService.create(payload);

    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing ? 'Permission updated successfully.' : 'Permission created successfully.'
        );
        this.cancelForm();
        this.loadPermissions();
      },
      error: (error) =>
        this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not save the permission. Please verify the data.'),
    });
  }

  /**
   * Closes the form and resets its state.
   */
  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingPermissionId = null;
    this.permissionForm.reset({ url: '', method: '', entity: '' });
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
      entity: this.permissionForm.value.entity as string,
    };
  }
}
