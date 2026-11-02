import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { PasswordRecoveryService } from 'src/app/services/password-recovery.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  public readonly form: FormGroup<{ email: FormControl<string> }>;
  public isLoading = false;
  public confirmationMessage = '';
  public errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly passwordRecoveryService: PasswordRecoveryService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  public submit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.passwordRecoveryService
      .requestRecovery(this.form.controls.email.value)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => (this.confirmationMessage = response.message),
        error: () => {
          this.errorMessage =
            'No se pudo procesar la solicitud. Inténtalo de nuevo más tarde.';
        },
      });
  }
}
