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
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { PASSWORD_POLICY } from 'src/app/shared/validators/password-policy';
import { PasswordRecoveryService } from 'src/app/services/password-recovery.service';

const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('newPassword')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return confirmation && password !== confirmation
    ? { passwordsMismatch: true }
    : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  public readonly token: string | null;
  public readonly form: FormGroup<{
    newPassword: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;
  public isLoading = false;
  public isComplete = false;
  public isInvalidToken = false;
  public errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token = token?.trim() ? token : null;
    this.isInvalidToken = !this.token;

    this.form = this.formBuilder.nonNullable.group(
      {
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(72),
            Validators.pattern(PASSWORD_POLICY),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    );
  }

  public submit(): void {
    if (this.form.invalid || this.isLoading || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.passwordRecoveryService
      .resetPassword(this.token, this.form.controls.newPassword.value)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => (this.isComplete = true),
        error: (error) => {
          if (error?.status === 400) {
            this.isInvalidToken = true;
            return;
          }
          this.errorMessage =
            'No se pudo restablecer la contraseña. Inténtalo de nuevo más tarde.';
        },
      });
  }
}
