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
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { RoleRequestDTO } from 'src/app/models/dtos/role-request.dto';
import { Role } from 'src/app/models/role.model';
import { RoleService } from 'src/app/services/role.service';
import { FeedbackService } from 'src/app/services/feedback.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
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
  public roleForm: FormGroup;
  public showForm = false;
  public isEditing = false;
  public isLoading = false;
  public confirmDeleteOpen = false;
  private editingRoleId: number | null = null;
  public pendingDeleteRole: Role | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly roleService: RoleService,
    private readonly feedbackService: FeedbackService
  ) {
    this.roleForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  public ngOnInit(): void {
    this.loadRoles();
  }

  public loadRoles(): void {
    this.isLoading = true;
    this.roleService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (roles: Role[]) => (this.roles = roles),
        error: (error) =>
          this.feedbackService.error(String(error?.status ?? 500), 'Could not load roles. Please try again.'),
      });
  }

  public onCreateClick(): void {
    this.isEditing = false;
    this.editingRoleId = null;
    this.roleForm.reset({ name: '', description: '' });
    this.showForm = true;
  }

  public onEdit(role: Role): void {
    this.isEditing = true;
    this.editingRoleId = role.id;
    this.roleForm.reset({
      name: role.name,
      description: role.description,
    });
    this.showForm = true;
  }

  public onView(role: Role): void {
    this.feedbackService.info('200', `Role #${role.id}: ${role.name} - ${role.description}`);
  }

  public onDelete(role: Role): void {
    this.pendingDeleteRole = role;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.pendingDeleteRole) return;

    const role = this.pendingDeleteRole;
    this.isLoading = true;
    this.roleService
      .delete(role.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackService.success('204', 'Role deleted successfully.');
          this.confirmDeleteOpen = false;
          this.pendingDeleteRole = null;
          this.loadRoles();
        },
        error: (error) => {
          this.feedbackService.error(String(error?.status ?? 500), 'Could not delete the role.');
          this.confirmDeleteOpen = false;
          this.pendingDeleteRole = null;
        },
      });
  }

  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteRole = null;
    this.feedbackService.info('CANCELLED', 'Deletion cancelled.');
  }

  public onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.feedbackService.warning('400', 'Please complete all required fields before saving.');
      return;
    }

    const payload: RoleRequestDTO = this.buildPayload();
    this.isLoading = true;

    const wasEditing = this.isEditing;
    const request$ =
      wasEditing && this.editingRoleId !== null
        ? this.roleService.update(this.editingRoleId, payload)
        : this.roleService.create(payload);

    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: () => {
        this.feedbackService.success(
          wasEditing ? '200' : '201',
          wasEditing ? 'Role updated successfully.' : 'Role created successfully.'
        );
        this.cancelForm();
        this.loadRoles();
      },
      error: (error) =>
        this.feedbackService.error(String(error?.status ?? 500), 'Could not save the role. Please verify the data.'),
    });
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingRoleId = null;
    this.roleForm.reset({ name: '', description: '' });
  }

  private buildPayload(): RoleRequestDTO {
    return {
      name: this.roleForm.value.name as string,
      description: this.roleForm.value.description as string,
    };
  }
}
