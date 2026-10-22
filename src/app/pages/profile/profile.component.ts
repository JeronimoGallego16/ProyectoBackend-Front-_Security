import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DataTableComponent, TableColumn } from 'src/app/components/table-list/table-list.component';
import { DynamicFormComponent, FormFieldConfig } from 'src/app/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { MaterialModule } from 'src/app/material.module';
import { Profile } from 'src/app/models/profile.model';
import { ProfileRequestDTO } from 'src/app/models/dtos/profile-request.dto';
import { ProfileService } from 'src/app/services/profile.service';
import { UserService } from 'src/app/services/user.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { FeedbackCase } from 'src/app/models/feedback-case';

interface ProfileTableRow {
  id: number;
  userId: number;
  userName: string;
  phone: string;
  birthDate: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    DataTableComponent,
    DynamicFormComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  public columns: TableColumn[] = [
    { field: 'id', header: 'Profile ID' },
    { field: 'userId', header: 'User ID' },
    { field: 'userName', header: 'User' },
    { field: 'phone', header: 'Phone' },
    { field: 'birthDate', header: 'Birth date' },
  ];

  public fields: FormFieldConfig[] = [
    { name: 'phone', label: 'Phone', type: 'text', placeholder: 'Phone number' },
    { name: 'birthDate', label: 'Birth date', type: 'date', placeholder: 'Birth date' },
  ];

  public lookupFields: FormFieldConfig[] = [
    { name: 'userId', label: 'User ID', type: 'text', placeholder: 'User ID' },
  ];

  public profiles: ProfileTableRow[] = [];
  public selectedUserId: number | null = null;
  public selectedUserName = '';
  public currentProfile: Profile | null = null;
  public isLoading = false;
  public showForm = false;
  public showLookup = false;
  public viewOnly = false;
  public isEditing = false;
  public isCreateFlow = false;
  public confirmDeleteOpen = false;

  public lookupForm: FormGroup;
  public profileForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly feedbackHandlerService: FeedbackHandlerService
  ) {
    this.lookupForm = this.formBuilder.group({
      userId: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    });

    this.profileForm = this.formBuilder.group({
      phone: ['', [Validators.required, Validators.maxLength(30)]],
      birthDate: ['', [Validators.required]],
    });
  }

  public ngOnInit(): void {
    this.loadProfiles();
  }

  public loadProfiles(): void {
    this.isLoading = true;
    this.userService.findAll().subscribe({
      next: (users) => {
        if (!users || users.length === 0) {
          this.profiles = [];
          this.isLoading = false;
          return;
        }

        const requests = users.map((user) =>
          this.profileService.findByUserId(user.id).pipe(
            map((profile) => ({
              id: profile.id,
              userId: user.id,
              userName: user.name,
              phone: profile.phone,
              birthDate: profile.birthDate,
            } as ProfileTableRow)),
            catchError(() => of(null))
          )
        );

        forkJoin(requests).subscribe({
          next: (rows) => {
            this.profiles = rows.filter((row): row is ProfileTableRow => row !== null);
            this.isLoading = false;
          },
          error: (error) => {
            this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load profiles.');
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load users.');
        this.isLoading = false;
      },
    });
  }

  public onCreateClick(): void {
    this.isCreateFlow = true;
    this.selectedUserId = null;
    this.selectedUserName = '';
    this.currentProfile = null;
    this.viewOnly = false;
    this.showForm = false;
    this.showLookup = true;
    this.lookupForm.reset({ userId: '' });
    this.feedbackHandlerService.info(FeedbackCase.INFO, 'Enter a user ID to create a profile.');
  }

  public onLookupUser(): void {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      this.feedbackHandlerService.warning(FeedbackCase.BAD_REQUEST, 'Please enter a user ID.');
      return;
    }

    const userId = Number(this.lookupForm.value.userId);

    if (isNaN(userId) || userId <= 0) {
      this.feedbackHandlerService.warning(FeedbackCase.BAD_REQUEST, 'Please enter a valid user ID.');
      return;
    }

    this.userService.findById(userId).subscribe({
      next: (user) => {
        if (this.isCreateFlow) {
          this.profileService.findByUserId(userId).subscribe({
            next: () => {
              this.feedbackHandlerService.error(FeedbackCase.CONFLICT, 'This user already has a profile.');
              this.isCreateFlow = false;
              this.showLookup = true;
            },
            error: (error) => {
              if (error?.status === 404) {
                this.selectedUserId = user.id;
                this.selectedUserName = user.name;
                this.currentProfile = null;
                this.isEditing = false;
                this.viewOnly = false;
                this.showLookup = false;
                this.showForm = true;
                this.profileForm.reset({ phone: '', birthDate: null });
              } else {
                this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not check the profile.');
              }
            },
          });
        } else {
          this.showLookup = false;
          this.onManageProfileById(userId, user.name);
        }
      },
      error: (error) => this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.NOT_FOUND), 'User not found.'),
    });
  }

  public onManageProfile(row: ProfileTableRow): void {
    this.onManageProfileById(row.userId, row.userName);
  }

  private onManageProfileById(userId: number, userName = ''): void {
    this.isCreateFlow = false;
    this.viewOnly = true;
    this.showForm = false;
    this.selectedUserId = userId;
    this.selectedUserName = userName;
    this.showLookup = false;
    this.isLoading = true;
    this.currentProfile = null;

    this.profileService.findByUserId(userId).pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.feedbackHandlerService.info(FeedbackCase.OK, `Profile loaded for user #${userId}.`);
      },
      error: (error) => {
        if (error?.status === 404) {
          this.currentProfile = null;
          this.feedbackHandlerService.warning('404', `User #${userId} has no profile yet.`);
        } else {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load the profile.');
        }
      },
    });
  }

  public onEditProfile(row: ProfileTableRow): void {
    this.isCreateFlow = false;
    this.viewOnly = false;
    this.selectedUserId = row.userId;
    this.selectedUserName = row.userName;
    this.showLookup = false;
    this.showForm = false;
    this.isLoading = true;
    this.currentProfile = null;

    this.profileService.findByUserId(row.userId).pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.isEditing = true;
        this.profileForm.patchValue({
          phone: profile.phone,
          birthDate: profile.birthDate ? new Date(profile.birthDate + 'T00:00:00') : null,
        });
        this.showForm = true;
      },
      error: (error) => {
        if (error?.status === 404) {
          this.currentProfile = null;
          this.isEditing = false;
          this.profileForm.reset({ phone: '', birthDate: null });
          this.showForm = true;
          this.feedbackHandlerService.info('404', `No profile yet for user #${row.userId}. You can create one.`);
        } else {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load the profile.');
        }
      },
    });
  }

  public onDeleteProfile(row: ProfileTableRow): void {
    this.isCreateFlow = false;
    this.viewOnly = false;
    this.selectedUserId = row.userId;
    this.selectedUserName = row.userName;
    this.showLookup = false;
    this.showForm = false;
    this.isLoading = true;
    this.currentProfile = null;

    this.profileService.findByUserId(row.userId).pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.confirmDeleteOpen = true;
      },
      error: (error) => {
        if (error?.status === 404) {
          this.feedbackHandlerService.warning('404', `User #${row.userId} has no profile to delete.`);
        } else {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load the profile.');
        }
      },
    });
  }

  public onSubmit(): void {
    if (!this.selectedUserId) return;
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.feedbackHandlerService.warning(FeedbackCase.BAD_REQUEST, 'Please complete all required fields before saving.');
      return;
    }

    const birthDate = this.profileForm.value.birthDate as Date | null;

    if (birthDate && birthDate > new Date()) {
      this.feedbackHandlerService.warning(FeedbackCase.BAD_REQUEST, 'Invalid date');
      return;
    }

    const payload: ProfileRequestDTO = this.buildPayload();
    this.isLoading = true;

    const request$ = this.isEditing
      ? this.profileService.update(this.selectedUserId, payload)
      : this.profileService.create(this.selectedUserId, payload);

    request$.pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        const wasEditing = this.isEditing;
        this.currentProfile = profile;
        this.isEditing = true;

        if (wasEditing) {
          this.feedbackHandlerService.success(FeedbackCase.OK, 'Profile updated successfully.');
        } else {
          this.feedbackHandlerService.success(FeedbackCase.CREATED, 'Profile created successfully.');
        }

        this.loadProfiles();
        this.clearSelection();
      },
      error: (error) => {
        if (error?.status === 409) {
          this.feedbackHandlerService.warning(FeedbackCase.CONFLICT, 'This user already has a profile.');
        } else {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not save the profile. Please verify the data.');
        }
      },
    });
  }

  public onDelete(): void {
    if (!this.selectedUserId || !this.currentProfile) return;
    this.confirmDeleteOpen = true;
  }

  public onConfirmDelete(): void {
    if (!this.selectedUserId) return;

    this.isLoading = true;
    this.profileService
      .delete(this.selectedUserId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.currentProfile = null;
          this.isEditing = false;
          this.profileForm.reset({ phone: '', birthDate: null });
          this.confirmDeleteOpen = false;
          this.feedbackHandlerService.success(FeedbackCase.NO_CONTENT, 'Profile deleted successfully.');
          this.loadProfiles();
          this.clearSelection();
        },
        error: (error) => {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not delete the profile.');
          this.confirmDeleteOpen = false;
        },
      });
  }

  public onCancelDelete(): void {
    this.confirmDeleteOpen = false;
    this.feedbackHandlerService.info(FeedbackCase.CANCELLED, 'Deletion cancelled.');
  }

  public cancelForm(): void {
    this.feedbackHandlerService.info(FeedbackCase.CANCELLED, 'Edition cancelled.');
    this.clearSelection();
  }

  public clearSelection(): void {
    this.isCreateFlow = false;
    this.selectedUserId = null;
    this.selectedUserName = '';
    this.showLookup = false;
    this.viewOnly = false;
    this.currentProfile = null;
    this.showForm = false;
    this.profileForm.reset({ phone: '', birthDate: null });
  }

  private buildPayload(): ProfileRequestDTO {
    const birthDate = this.profileForm.value.birthDate;

    return {
      phone: this.profileForm.value.phone as string,
      birthDate:
        birthDate instanceof Date
          ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(
              birthDate.getDate()
            ).padStart(2, '0')}`
          : (birthDate as string),
    };
  }
}
