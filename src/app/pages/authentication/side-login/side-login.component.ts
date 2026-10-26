import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OAuthService } from 'src/app/services/oauth.service';
import { OAuthResult } from 'src/app/models/oauth/oauth-result.model';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements OnInit {
  /**
   * OAuth service used to delegate social authentication.
   */
  private readonly oauthService = inject(OAuthService);

  /**
   * Creates the login page controller.
   *
   * @param router - Router used to navigate after authentication.
   * @param feedbackHandler - Service used to display authentication feedback.
   */
  constructor(
    private router: Router,
    private readonly feedbackHandler: FeedbackHandlerService
  ) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required]),
  });

  /**
   * Loading state for OAuth flows.
   */
  public isOAuthLoading: boolean = false;

  /**
   * OAuthResult captured from a successful flow. This is left as an integration point
   * for the future general authentication/session service to consume.
   */
  public lastOAuthResult: OAuthResult | null = null;

  get f() {
    return this.form.controls;
  }

  submit() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    // Attempt to process Microsoft redirect result if present (for testing purposes only)
    this.handleMicrosoftRedirectIfAny();
  }

  /**
   * Initiates Google OAuth sign-in via OAuthService.
   * Does not navigate automatically.
   */
  public async loginWithGoogle(): Promise<void> {
    this.clearOAuthState();
    this.isOAuthLoading = true;
    try {
      const result = await this.oauthService.loginWithGoogle();
      this.lastOAuthResult = result;
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.publishOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  /**
   * Initiates Microsoft OAuth sign-in via OAuthService.
   * Falls back to redirect if popup is blocked/cancelled per OAuthService logic.
   * Does not navigate automatically.
   */
  public async loginWithMicrosoft(): Promise<void> {
    this.clearOAuthState();
    this.isOAuthLoading = true;
    try {
      const result = await this.oauthService.loginWithMicrosoft();
      this.lastOAuthResult = result;
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      if (message === 'MICROSOFT_REDIRECT_INITIATED') {
        return;
      }
      this.publishOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  /**
   * Initiates GitHub OAuth sign-in via OAuthService.
   * Does not navigate automatically.
   */
  public async loginWithGithub(): Promise<void> {
    this.clearOAuthState();
    this.isOAuthLoading = true;
    try {
      const result = await this.oauthService.loginWithGithub();
      this.lastOAuthResult = result;
      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      this.publishOAuthError(error);
    } finally {
      this.isOAuthLoading = false;
    }
  }

  /**
   * Processes pending Microsoft redirect result without automatic navigation.
   * Captures OAuthResult at integration point for future consumption.
   */
  private async handleMicrosoftRedirectIfAny(): Promise<void> {
    this.clearOAuthState();
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

  /**
   * Clears OAuth related state before starting a new flow.
   */
  private clearOAuthState(): void {
    this.lastOAuthResult = null;
  }

  /**
   * Publishes a normalized OAuth error through the global feedback handler.
   *
   * @param error - Error raised by the OAuth provider or authentication flow.
   */
  private publishOAuthError(error: unknown): void {
    this.feedbackHandler.error(
      'OAUTH_LOGIN_FAILED',
      this.getErrorMessage(error),
      { title: 'Authentication error' }
    );
  }

  /**
   * Extracts a displayable error message from unknown error.
   */
  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        return (error as { message: string }).message;
      }
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An error occurred during OAuth authentication.';
  }
}
