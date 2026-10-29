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
import { finalize, firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { OAuthService } from 'src/app/services/oauth.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { OAuthResult } from 'src/app/models/oauth/oauth-result.model';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements OnInit {
  private readonly oauthService = inject(OAuthService);

  public isLoading = false;
  public isOAuthLoading = false;
  public isPasswordVisible = false;
  public readonly form: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly feedbackHandlerService: FeedbackHandlerService
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

    this.isLoading = true;
    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (error) => {
          this.handleLoginError(error);
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
    this.isOAuthLoading = true;

    try {
      const result = await this.oauthService.loginWithMicrosoft();
      await this.authenticateWithBackend(result.idToken);
    } catch (error: unknown) {
      if (
        this.getErrorMessage(this.getErrorResponse(error))
        !== 'MICROSOFT_REDIRECT_INITIATED'
      ) {
        this.handleOAuthError(error);
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

  /**
   * Runs the Firebase flow and exchanges the ID token with the backend.
   * Navigation only happens once the backend confirms the session.
   *
   * @param login - Firebase OAuth operation to execute.
   */
  private async loginWithOAuth(login: () => Promise<OAuthResult>): Promise<void> {
    this.isOAuthLoading = true;

    try {
      const result = await login();
      await this.authenticateWithBackend(result.idToken);
    } catch (error: unknown) {
      this.handleOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  /**
   * Processes a pending Microsoft redirect result and exchanges it with the backend.
   */
  private async handleMicrosoftRedirectIfAny(): Promise<void> {
    this.isOAuthLoading = true;

    try {
      const result = await this.oauthService.handleMicrosoftRedirect();
      if (result) {
        await this.authenticateWithBackend(result.idToken);
      }
    } catch (error: unknown) {
      this.handleOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  /**
   * Sends the Firebase ID token to the backend and navigates after a confirmed session.
   *
   * @param idToken - Firebase ID token issued after a successful OAuth flow.
   */
  private async authenticateWithBackend(idToken: string): Promise<void> {
    await firstValueFrom(this.authService.loginWithOAuth({ idToken }));
    await this.router.navigate(['/dashboard']);
  }

  /**
   * Applies the same error handling used by the classic login form.
   *
   * @param error - Error thrown by Firebase or the backend.
   */
  private handleOAuthError(error: unknown): void {
    this.showFeedback(error);
  }

  /**
   * Publishes the error received from the authentication endpoint.
   *
   * @param error - Error thrown by the authentication service.
   */
  private handleLoginError(error: unknown): void {
    this.showFeedback(error);
  }

  /**
   * Uses the backend status as the feedback case and the backend-provided
   * message as the toast content.
   *
   * @param error - Error thrown by an authentication operation.
   */
  private showFeedback(error: unknown): void {
    const response = this.getErrorResponse(error);
    const code = response.status === 401
      ? FeedbackCase.UNAUTHORIZED
      : String(response.status ?? FeedbackCase.SERVER_ERROR);
    const message = this.getErrorMessage(response);
    this.feedbackHandlerService.error(code, message);
  }

  /**
   * Safely extracts the response fields used by the feedback handler.
   *
   * @param error - Unknown error.
   * @returns Error response fields when present.
   */
  private getErrorResponse(error: unknown): {
    status?: number;
    message?: string;
    error?: { message?: string } | string;
    statusText?: string;
  } {
    if (typeof error === 'object' && error !== null) {
      return error as {
        status?: number;
        message?: string;
        error?: { message?: string } | string;
        statusText?: string;
      };
    }

    return { message: typeof error === 'string' ? error : undefined };
  }

  /**
   * Resolves the message supplied by the backend or authentication provider.
   *
   * @param response - Error response fields.
   * @returns Message to publish through the feedback service.
   */
  private getErrorMessage(response: {
    message?: string;
    error?: { message?: string } | string;
    statusText?: string;
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

    if (response.statusText?.trim()) {
      return response.statusText;
    }

    return response.message ?? '';
  }
}
