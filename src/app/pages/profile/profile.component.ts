import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { DynamicFormComponent, FormFieldConfig } from 'src/app/components/dynamic-form/dynamic-form.component';
import { MaterialModule } from 'src/app/material.module';
import { User } from 'src/app/models/user.model';
import { Profile } from 'src/app/models/profile.model';
import { ProfileRequestDTO } from 'src/app/models/dtos/profile-request.dto';
import { ProfileService } from 'src/app/services/profile.service';
import { UserService } from 'src/app/services/user.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  public userColumns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'name', header: 'Name' },
    { field: 'email', header: 'Email' },
  ];

  public fields: FormFieldConfig[] = [
    { name: 'phone', label: 'Phone', type: 'text', placeholder: 'Phone number' },
    { name: 'birthDate', label: 'Birth date', type: 'date', placeholder: 'Birth date' },
  ];

  public users: User[] = [];
  public selectedUser: User | null = null;
  public currentProfile: Profile | null = null;
  public isLoading = false;
  public showForm = false;
  public isEditing = false;

  public profileForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly toastService: ToastService
  ) {
    this.profileForm = this.formBuilder.group({
      phone: ['', [Validators.required, Validators.maxLength(30)]],
      birthDate: ['', [Validators.required]],
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
        error: () => this.toastService.error('Could not load users.'),
      });
  }

  public onManageProfile(user: User): void {
    this.selectedUser = user;
    this.currentProfile = null;
    this.showForm = false;
    this.profileForm.reset({ phone: '', birthDate: '' });

    this.profileService.findByUserId(user.id).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.isEditing = true;
        this.profileForm.patchValue({
          phone: profile.phone,
          birthDate: profile.birthDate,
        });
        this.showForm = true;
        this.toastService.info(`Profile loaded for user #${user.id}.`);
      },
      error: (error) => {
        if (error?.status === 404) {
          this.currentProfile = null;
          this.isEditing = false;
          this.profileForm.reset({ phone: '', birthDate: '' });
          this.showForm = true;
          this.toastService.info(`No profile yet for user #${user.id}. You can create one.`);
        } else {
          this.toastService.error('Could not load the profile.');
        }
      },
    });
  }

  public onSubmit(): void {
    if (!this.selectedUser) return;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.warning('Please complete all required fields before saving.');
      return;
    }

    const payload: ProfileRequestDTO = this.buildPayload();
    this.isLoading = true;

    const request$ = this.isEditing
      ? this.profileService.update(this.selectedUser.id, payload)
      : this.profileService.create(this.selectedUser.id, payload);

    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        const wasEditing = this.isEditing;
        this.currentProfile = profile;
        this.isEditing = true;
        this.toastService.success(wasEditing ? 'Profile updated successfully.' : 'Profile created successfully.');
      },
      error: (error) => {
        if (error?.status === 409) {
          this.toastService.warning('This user already has a profile.');
        } else {
          this.toastService.error('Could not save the profile. Please verify the data.');
        }
      },
    });
  }

  public onDelete(): void {
    if (!this.selectedUser || !this.currentProfile) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the profile of "${this.selectedUser.name}"?`
    );
    if (!confirmed) {
      this.toastService.info('Deletion cancelled.');
      return;
    }

    this.isLoading = true;
    this.profileService
      .delete(this.selectedUser.id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.currentProfile = null;
          this.isEditing = false;
          this.profileForm.reset({ phone: '', birthDate: '' });
          this.toastService.success('Profile deleted successfully.');
        },
        error: () => this.toastService.error('Could not delete the profile.'),
      });
  }

  public cancelForm(): void {
    if (this.selectedUser) this.onManageProfile(this.selectedUser);
  }

  public clearSelection(): void {
    this.selectedUser = null;
    this.currentProfile = null;
    this.showForm = false;
    this.profileForm.reset({ phone: '', birthDate: '' });
  }

  private buildPayload(): ProfileRequestDTO {
    return {
      phone: this.profileForm.value.phone as string,
      birthDate: this.profileForm.value.birthDate as string,
    };
  }
}
