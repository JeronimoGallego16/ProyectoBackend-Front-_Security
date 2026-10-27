import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import {
  DataTableComponent,
  TableColumn,
} from 'src/app/components/table-list/table-list.component';
import {
  DynamicFormComponent,
  FormFieldConfig,
} from 'src/app/components/dynamic-form/dynamic-form.component';
import { MaterialModule } from 'src/app/material.module';
import { CreateUserDTO } from 'src/app/models/dtos/create-user.dto';
import { UpdateUserDTO } from 'src/app/models/dtos/update-user.dto';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { User } from 'src/app/models/user.model';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { UserService } from 'src/app/services/user.service';

interface UserFormControls {
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{8,72}$/;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  public readonly columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'email', header: 'Email' },
  ];

  public readonly createFields: FormFieldConfig[] = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'User name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Email address' },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Password',
      hint: '8–72 characters; uppercase, lowercase, number, and one of @$!%*?&; no spaces.',
    },
  ];

  public readonly editFields: FormFieldConfig[] = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'User name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Email address' },
    {
      name: 'password',
      label: 'New password (optional)',
      type: 'password',
      placeholder: 'Leave blank to keep the current password',
      hint: 'If entered: 8–72 characters; uppercase, lowercase, number, and one of @$!%*?&; no spaces.',
    },
  ];

  public users: User[] = [];
  public userForm: FormGroup<UserFormControls>;
  public isLoading = false;
  public showForm = false;
  public isEditing = false;
  public selectedUser: User | null = null;
  public confirmDeleteOpen = false;
  public pendingDeleteUser: User | null = null;
  private editingUserId: number | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.userForm = this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', []],
    });
  }

  public ngOnInit(): void {
    this.loadUsers();
  }

  public loadUsers(): void {
    this.isLoading = true;
    this.userService
      .findAll()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => (this.users = users),
        error: (error) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not load users. Check that the backend is available.'
          ),
      });
  }

  public onCreateClick(): void {
    this.selectedUser = null;
    this.isEditing = false;
    this.editingUserId = null;
    this.userForm.reset({ name: '', email: '', password: '' });
    this.userForm.controls.password.setValidators([
      Validators.required,
      Validators.pattern(PASSWORD_POLICY),
    ]);
    this.userForm.controls.password.updateValueAndValidity();
    this.showForm = true;
  }

  public onEdit(user: User): void {
    this.selectedUser = null;
    this.isEditing = true;
    this.editingUserId = user.id;
    this.userForm.reset({ name: user.name, email: user.email, password: '' });
    this.userForm.controls.password.setValidators([
      Validators.pattern(PASSWORD_POLICY),
    ]);
    this.userForm.controls.password.updateValueAndValidity();
    this.showForm = true;
  }

  public onView(user: User): void {
    this.isLoading = true;
    this.userService
      .findById(user.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (details) => {
          this.selectedUser = {
            id: details.id,
            name: details.name,
            email: details.email,
          };
          this.showForm = false;
        },
        error: (error) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not load user details.'
          ),
      });
  }

  public onDelete(user: User): void {
    this.pendingDeleteUser = user;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.pendingDeleteUser) return;

    const user = this.pendingDeleteUser;
    this.isLoading = true;
    this.userService
      .delete(user.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.NO_CONTENT,
            'User deleted successfully.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteUser = null;
          this.users = this.users.filter((item) => item.id !== user.id);
        },
        error: (error) => {
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not delete the user. Check whether the user has related records.'
          );
          this.confirmDeleteOpen = false;
          this.pendingDeleteUser = null;
        },
      });
  }

  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.pendingDeleteUser = null;
    this.feedbackHandlerService.info(FeedbackCase.CANCELLED, 'Deletion cancelled.');
  }

  public onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please enter a valid name, email, and password according to the requirements.'
      );
      return;
    }

    const { name, email, password } = this.userForm.getRawValue();
    const wasEditing = this.isEditing;
    const editingUserId = this.editingUserId;
    let request$: Observable<User>;
    if (wasEditing) {
      if (editingUserId === null) {
        this.feedbackHandlerService.error(
          FeedbackCase.SERVER_ERROR,
          'Cannot update the user because its ID is missing.'
        );
        return;
      }
      request$ = this.userService.update(
        editingUserId,
        this.buildUpdatePayload(name, email, password)
      );
    } else {
      request$ = this.userService.create({ name, email, password } satisfies CreateUserDTO);
    }

    this.isLoading = true;
    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (savedUser) => {
        this.feedbackHandlerService.success(
          wasEditing ? FeedbackCase.OK : FeedbackCase.CREATED,
          wasEditing ? 'User updated successfully.' : 'User created successfully.'
        );
        this.cancelForm();
        this.users = wasEditing
          ? this.users.map((user) => user.id === savedUser.id ? savedUser : user)
          : [...this.users, savedUser];
      },
      error: (error) =>
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          error?.status === 409
            ? 'A user with this email already exists.'
            : 'Could not save the user. Verify the values and try again.'
        ),
    });
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingUserId = null;
    this.userForm.reset({ name: '', email: '', password: '' });
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
  }

  public closeDetails(): void {
    this.selectedUser = null;
  }

  private buildUpdatePayload(name: string, email: string, password: string): UpdateUserDTO {
    return password.length > 0
      ? { name, email, password }
      : { name, email };
  }
}
