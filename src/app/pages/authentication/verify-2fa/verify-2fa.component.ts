import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-2fa.component.html',
})
export class Verify2faComponent {
  public readonly form: FormGroup<{ code: FormControl<string> }>;
  public readonly challengeId: string | null;
  public isLoading = false;
  public errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    const challengeId: unknown = history.state?.challengeId;
    this.challengeId =
      typeof challengeId === 'string' && challengeId.trim()
        ? challengeId
        : null;

    this.form = this.formBuilder.nonNullable.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  public submit(): void {
    if (this.form.invalid || this.isLoading || !this.challengeId) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.authService
      .verifyTwoFactor(this.challengeId, this.form.controls.code.value)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error) => {
          this.errorMessage =
            error?.status === 401
              ? 'El código de verificación no es válido o expiró.'
              : 'No se pudo verificar el código. Inténtalo de nuevo.';
        },
      });
  }
}
