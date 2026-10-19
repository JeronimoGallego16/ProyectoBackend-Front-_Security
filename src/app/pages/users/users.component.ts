import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { DynamicFormComponent, FormFieldConfig } from 'src/app/components/dynamic-form/dynamic-form.component';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { User } from 'src/app/models/user.model';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
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
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
  ];

  public readonly editFields: FormFieldConfig[] = this.createFields.filter(
    (field) => field.name !== 'password'
  );

  public users: User[] = [];
  public userForm: FormGroup;
  public isLoading = false;
  public showForm = false;
  public isEditing = false;
  public selectedUser: User | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.userForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
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
    this.userForm.reset({ name: '', email: '', password: '' });
    this.userForm.controls['password'].setValidators([Validators.required]);
    this.userForm.controls['password'].updateValueAndValidity();
    this.showForm = true;
  }

  public onEdit(user: User): void {
    this.selectedUser = null;
    this.isEditing = true;
    this.userForm.reset({ name: user.name, email: user.email, password: '' });
    this.userForm.controls['password'].clearValidators();
    this.userForm.controls['password'].updateValueAndValidity();
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
    this.feedbackHandlerService.warning(
      FeedbackCase.INFO,
      `Deleting user #${user.id} is unavailable until the backend contract is defined.`
    );
  }

  public onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.feedbackHandlerService.warning(
        FeedbackCase.BAD_REQUEST,
        'Please complete the required fields with valid values.'
      );
      return;
    }

    this.feedbackHandlerService.info(
      FeedbackCase.INFO,
      'Saving users is unavailable until the backend contract is defined.'
    );
  }

  public cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.userForm.reset({ name: '', email: '', password: '' });
    this.userForm.controls['password'].clearValidators();
    this.userForm.controls['password'].updateValueAndValidity();
  }

  public closeDetails(): void {
    this.selectedUser = null;
  }
}
