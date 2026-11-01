import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';

const passwordPattern =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,72}$/;

const matchingPasswordsValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return password === confirmation ? null : { passwordsMismatch: true };
};

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './side-register.component.html',
})
export class AppSideRegisterComponent {
  public isLoading = false;
  public isPasswordVisible = false;
  public isConfirmationVisible = false;
  public submitError = '';

  public readonly form: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.pattern(passwordPattern)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: matchingPasswordsValidator }
    );
  }

  public submit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitError = '';
    this.isLoading = true;
    const { name, email, password } = this.form.getRawValue();

    this.authService
      .register({ name, email, password })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (session) => {
          this.authService.getPostAuthenticationRoute(session).subscribe({
            next: (route) => void this.router.navigate([route]),
            error: (error) => this.handleRegistrationError(error),
          });
        },
        error: (error: unknown) => this.handleRegistrationError(error),
      });
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  public toggleConfirmationVisibility(): void {
    this.isConfirmationVisible = !this.isConfirmationVisible;
  }

  private handleRegistrationError(error: unknown): void {
    const response = this.getErrorResponse(error);

    if (response.status === 400) {
      this.submitError = this.getBackendMessage(response) || 'The registration data is invalid.';
      return;
    }

    if (response.status === 409) {
      this.submitError = 'This email is already registered.';
      return;
    }

    if (response.status === 403) {
      this.submitError = 'Your security token is invalid or expired. Please try again.';
      return;
    }

    if (response.status === 0) {
      this.submitError = 'Could not connect to the server. Please try again.';
      return;
    }

    this.submitError = this.getBackendMessage(response)
      || 'Registration failed. Please try again.';
  }

  private getErrorResponse(error: unknown): {
    status?: number;
    message?: string;
    error?: { message?: string } | string;
  } {
    if (typeof error === 'object' && error !== null) {
      return error as {
        status?: number;
        message?: string;
        error?: { message?: string } | string;
      };
    }

    return {};
  }

  private getBackendMessage(response: {
    message?: string;
    error?: { message?: string } | string;
  }): string {
    if (typeof response.error === 'string' && response.error.trim()) {
      return response.error;
    }

    if (
      response.error
      && typeof response.error === 'object'
      && response.error.message?.trim()
    ) {
      return response.error.message;
    }

    return response.message?.trim() ?? '';
  }
}
