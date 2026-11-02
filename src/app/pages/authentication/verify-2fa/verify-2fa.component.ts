import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [MaterialModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-2fa.component.html',
})
export class Verify2faComponent implements OnInit, OnDestroy {
  public readonly form: FormGroup<{
    code: FormControl<string>;
  }>;
  public email = '';
  public secondsRemaining = 0;
  public isLoading = false;
  public errorMessage = '';
  public isExpired = false;
  private countdown?: Subscription;
  private expiresAt = 0;

  constructor(
    formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = formBuilder.nonNullable.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  public ngOnInit(): void {
    const pending = this.authService.getPendingTwoFactor();
    if (!pending) {
      void this.router.navigate(['/authentication/login']);
      return;
    }

    this.email = pending.email;
    this.expiresAt = Date.parse(pending.challenge.expiresAt);
    this.updateCountdown();
    this.countdown = interval(1000).subscribe(() => this.updateCountdown());
  }

  public ngOnDestroy(): void {
    this.countdown?.unsubscribe();
  }

  public verify(): void {
    const pending = this.authService.getPendingTwoFactor();
    if (!pending || this.isExpired || this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.authService
      .verifyTwoFactor(pending.challenge.challengeId, this.form.controls.code.value)
      .subscribe({
        next: (session) => {
          this.authService.getPostAuthenticationRoute(session).subscribe({
            next: (route) => void this.router.navigate([route]),
            error: () => {
              this.isLoading = false;
              this.errorMessage = 'No se pudo determinar la página inicial. Intenta nuevamente.';
            },
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error?.status === 400
            ? 'El código debe tener 6 dígitos.'
            : error?.status === 401
              ? 'El código es incorrecto o ha expirado.'
              : error?.status === 0
                ? 'No se pudo conectar con el backend.'
                : 'No se pudo verificar el código. Intenta nuevamente.';
        },
      });
  }

  public cancel(): void {
    this.authService.clearPendingTwoFactor();
    void this.router.navigate(['/authentication/login']);
  }

  private updateCountdown(): void {
    this.secondsRemaining = Math.max(0, Math.ceil((this.expiresAt - Date.now()) / 1000));
    if (this.secondsRemaining === 0) {
      this.isExpired = true;
      this.countdown?.unsubscribe();
    }
  }
}
