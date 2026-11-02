import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { DynamicFormComponent, FormFieldConfig } from 'src/app/components/dynamic-form/dynamic-form.component';
import { AuthSession } from 'src/app/models/auth-response.model';
import { Profile } from 'src/app/models/profile.model';
import { ProfileRequestDTO } from 'src/app/models/dtos/profile-request.dto';
import { AuthService } from 'src/app/services/auth.service';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, MaterialModule, ReactiveFormsModule, DynamicFormComponent],
  providers: [provideNativeDateAdapter()],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit, OnDestroy {
  public session: AuthSession | null = null;
  public profile: Profile | null = null;
  public isLoading = true;
  public isSaving = false;
  public isEditing = false;
  public selectedImage: File | null = null;
  public imagePreviewUrl: string | null = null;
  public imageError = '';
  public hasProfile = true;
  public readonly today = new Date();
  public readonly fields: FormFieldConfig[] = [
    { name: 'phone', label: 'Phone', type: 'text', placeholder: 'Phone number' },
    { name: 'birthDate', label: 'Birth date', type: 'date', placeholder: 'Birth date' },
  ];

  public readonly form: FormGroup = this.formBuilder.group({
    phone: ['', [Validators.required, Validators.maxLength(30)]],
    birthDate: ['', [Validators.required]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly feedbackHandlerService: FeedbackHandlerService,
    private readonly router: Router
  ) {}

  public ngOnInit(): void {
    this.authService.getSession().subscribe({
      next: (session) => {
        this.session = session;
        this.loadProfile(session.id);
      },
      error: () => void this.router.navigate(['/authentication/login']),
    });
  }

  public ngOnDestroy(): void {
    this.revokePreview();
  }

  public imageUrl(): string | null {
    return this.profileService.resolveImageUrl(this.profile?.profileImageUrl);
  }

  public startEditing(): void {
    if (!this.profile) return;
    this.form.patchValue({
      phone: this.profile.phone,
      birthDate: this.profile.birthDate
        ? new Date(`${this.profile.birthDate}T00:00:00`)
        : null,
    });
    this.resetImage();
    this.isEditing = true;
  }

  public createProfile(): void {
    void this.router.navigate(['/profile-setup'], {
      queryParams: { returnTo: 'my-profile' },
    });
  }

  public goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  public cancelEditing(): void {
    this.isEditing = false;
    this.form.reset({ phone: '', birthDate: null });
    this.resetImage();
  }

  public onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageError = '';
    this.resetImage();

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.imageError = 'Only JPG, PNG, or WEBP images are allowed.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageError = 'The image must not exceed 5 MB.';
      input.value = '';
      return;
    }

    this.selectedImage = file;
    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  public save(): void {
    if (!this.session || !this.profile || this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    const birthDate = this.form.value.birthDate as Date | string | null;
    if (birthDate instanceof Date && birthDate > this.today) {
      this.form.controls['birthDate'].setErrors({ futureDate: true });
      return;
    }

    const payload: ProfileRequestDTO = {
      phone: this.form.value.phone as string,
      birthDate: birthDate instanceof Date
        ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(
            birthDate.getDate()
          ).padStart(2, '0')}`
        : (birthDate as string),
    };

    this.isSaving = true;
    this.profileService
      .update(this.session.id, payload, this.selectedImage ?? undefined)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isEditing = false;
          this.resetImage();
          this.feedbackHandlerService.success(FeedbackCase.OK, 'Profile updated successfully.');
        },
        error: (error) => this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          'Could not update your profile.'
        ),
      });
  }

  private loadProfile(userId: number): void {
    this.isLoading = true;
    this.profileService.findByUserId(userId).pipe(finalize(() => (this.isLoading = false))).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.hasProfile = true;
      },
      error: (error) => {
        if (error?.status === 404) {
          this.profile = null;
          this.hasProfile = false;
        } else {
          this.feedbackHandlerService.error(String(error?.status ?? FeedbackCase.SERVER_ERROR), 'Could not load your profile.');
        }
      },
    });
  }

  private resetImage(): void {
    this.revokePreview();
    this.selectedImage = null;
    this.imagePreviewUrl = null;
    this.imageError = '';
  }

  private revokePreview(): void {
    if (this.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
  }
}
