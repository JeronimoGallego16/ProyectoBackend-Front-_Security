import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { finalize } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { OAuthService } from 'src/app/services/oauth.service';
import { OAuthResult } from 'src/app/models/oauth/oauth-result.model';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements OnInit {
  private readonly oauthService = inject(OAuthService);
  private readonly feedbackHandler = inject(FeedbackHandlerService);

  public isLoading = false;
  public isOAuthLoading = false;
  public errorMessage = '';
  public isPasswordVisible = false;
  public lastOAuthResult: OAuthResult | null = null;
  public readonly form: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  public ngOnInit(): void {
    void this.handleMicrosoftRedirectIfAny();
  }

  public submit(): void {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (error) => {
          this.errorMessage =
            error?.status === 401
              ? 'Correo o contraseña incorrectos.'
              : 'No se pudo iniciar sesión. Verifica que el servicio esté disponible e inténtalo de nuevo.';
        },
      });
  }

  public togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  /**
   * Initiates Google OAuth sign-in and navigates to the dashboard on success.
   */
  public async loginWithGoogle(): Promise<void> {
    await this.loginWithOAuth(() => this.oauthService.loginWithGoogle());
  }

  /**
   * Initiates Microsoft OAuth sign-in and handles its popup-to-redirect fallback.
   */
  public async loginWithMicrosoft(): Promise<void> {
    this.clearOAuthState();
    this.isOAuthLoading = true;

    try {
      this.lastOAuthResult = await this.oauthService.loginWithMicrosoft();
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      if (this.getErrorMessage(error) !== 'MICROSOFT_REDIRECT_INITIATED') {
        this.publishOAuthError(error);
      }
    } finally {
      this.isOAuthLoading = false;
    }
  }

  /**
   * Initiates GitHub OAuth sign-in and navigates to the dashboard on success.
   */
  public async loginWithGithub(): Promise<void> {
    await this.loginWithOAuth(() => this.oauthService.loginWithGithub());
  }

  private async loginWithOAuth(login: () => Promise<OAuthResult>): Promise<void> {
    this.clearOAuthState();
    this.isOAuthLoading = true;

    try {
      this.lastOAuthResult = await login();
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.publishOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  private async handleMicrosoftRedirectIfAny(): Promise<void> {
    this.isOAuthLoading = true;

    try {
      const result = await this.oauthService.handleMicrosoftRedirect();
      if (result) {
        this.lastOAuthResult = result;
        await this.router.navigate(['/dashboard']);
      }
    } catch (error: unknown) {
      this.publishOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  private clearOAuthState(): void {
    this.lastOAuthResult = null;
  }

  private publishOAuthError(error: unknown): void {
    this.feedbackHandler.error(
      'OAUTH_LOGIN_FAILED',
      this.getErrorMessage(error),
      { title: 'Authentication error' }
    );
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }

    return typeof error === 'string'
      ? error
      : 'An error occurred during OAuth authentication.';
  }
}
