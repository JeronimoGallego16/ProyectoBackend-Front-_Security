import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MaterialModule } from 'src/app/material.module';
import { AuthSession } from 'src/app/models/auth-response.model';
import { ProfileRequestDTO } from 'src/app/models/dtos/profile-request.dto';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule],
  providers: [provideNativeDateAdapter()],
  templateUrl: './profile-setup.component.html',
  styleUrls: ['./profile-setup.component.scss'],
})
export class ProfileSetupComponent implements OnInit, OnDestroy {
  public readonly form: FormGroup<{
    phone: FormControl<string>;
    birthDate: FormControl<Date | null>;
  }>;
  public session: AuthSession | null = null;
  public selectedImage: File | null = null;
  public imagePreviewUrl: string | null = null;
  public imageError = '';
  public submitError = '';
  public isLoading = true;
  public isSaving = false;
  public readonly today = new Date();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly profileService: ProfileService,
    private readonly router: Router
  ) {
    this.form = new FormGroup({
      phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(30)],
      }),
      birthDate: new FormControl<Date | null>(null, {
        validators: [Validators.required],
      }),
    });
  }

  public ngOnInit(): void {
    this.authService.getSession().subscribe({
      next: (session) => {
        this.session = session;
        this.profileService.findByUserId(session.id).subscribe({
          next: () => void this.router.navigate(['/dashboard']),
          error: (error) => {
            if (error?.status !== 404) {
              this.submitError = 'Could not verify your profile. Please try again.';
            }
            this.isLoading = false;
          },
        });
      },
      error: () => void this.router.navigate(['/authentication/login']),
    });
  }

  public ngOnDestroy(): void {
    this.revokePreview();
  }

  public onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.imageError = '';
    this.revokePreview();
    this.selectedImage = null;

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

  public submit(): void {
    if (!this.session || this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    const birthDate = this.form.controls.birthDate.value;
    if (birthDate && birthDate > new Date()) {
      this.form.controls.birthDate.setErrors({ futureDate: true });
      return;
    }

    this.submitError = '';
    this.isSaving = true;
    const payload: ProfileRequestDTO = {
      phone: this.form.controls.phone.value,
      birthDate: birthDate
        ? `${birthDate.getFullYear()}-${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(
            birthDate.getDate()
          ).padStart(2, '0')}`
        : '',
    };

    this.profileService
      .create(this.session.id, payload, this.selectedImage ?? undefined)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error) => {
          this.submitError = error?.status === 409
            ? 'Your profile already exists.'
            : error?.status === 400
              ? 'Please verify the phone number and birth date.'
              : 'Could not create your profile. Please try again.';
        },
      });
  }

  public skip(): void {
    if (!this.isSaving) {
      void this.router.navigate(['/dashboard']);
    }
  }

  private revokePreview(): void {
    if (this.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imagePreviewUrl = null;
  }
}
