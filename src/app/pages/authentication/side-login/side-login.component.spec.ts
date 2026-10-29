import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSession } from 'src/app/models/auth-response.model';
import { OAuthResult } from 'src/app/models/oauth/oauth-result.model';
import { AuthService } from 'src/app/services/auth.service';
import { OAuthService } from 'src/app/services/oauth.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { AppSideLoginComponent } from './side-login.component';

const SESSION: AuthSession = {
  id: 1,
  name: 'OAuth User',
  email: 'oauth@example.com',
};

const OAUTH_RESULT: OAuthResult = {
  user: {
    provider: 'google',
    providerUserId: 'firebase-uid',
    displayName: 'OAuth User',
    email: 'oauth@example.com',
    photoUrl: null,
  },
  idToken: 'firebase-id-token',
};

describe('AppSideLoginComponent', () => {
  let component: AppSideLoginComponent;
  let fixture: ComponentFixture<AppSideLoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let oauthService: jasmine.SpyObj<OAuthService>;
  let feedbackHandlerService: jasmine.SpyObj<FeedbackHandlerService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'loginWithOAuth',
    ]);
    oauthService = jasmine.createSpyObj<OAuthService>('OAuthService', [
      'loginWithGoogle',
      'loginWithMicrosoft',
      'loginWithGithub',
      'handleMicrosoftRedirect',
    ]);
    feedbackHandlerService = jasmine.createSpyObj<FeedbackHandlerService>(
      'FeedbackHandlerService',
      ['error']
    );
    oauthService.handleMicrosoftRedirect.and.resolveTo(null);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: OAuthService, useValue: oauthService },
        { provide: FeedbackHandlerService, useValue: feedbackHandlerService },
      ],
    })
      .overrideComponent(AppSideLoginComponent, {
        set: { template: '', imports: [ReactiveFormsModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppSideLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('navigates only after the backend confirms the OAuth session', async () => {
    oauthService.loginWithGoogle.and.resolveTo(OAUTH_RESULT);
    authService.loginWithOAuth.and.returnValue(of(SESSION));

    await component.loginWithGoogle();

    expect(authService.loginWithOAuth).toHaveBeenCalledWith({
      idToken: 'firebase-id-token',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(feedbackHandlerService.error).not.toHaveBeenCalled();
  });

  it('does not navigate when the backend rejects the OAuth token', async () => {
    oauthService.loginWithGoogle.and.resolveTo(OAUTH_RESULT);
    authService.loginWithOAuth.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          })
      )
    );

    await component.loginWithGoogle();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(feedbackHandlerService.error).toHaveBeenCalledWith(
      '401',
      'Unauthorized'
    );
  });

  it('does not navigate and shows the classic login message on a network error', async () => {
    oauthService.loginWithGoogle.and.resolveTo(OAUTH_RESULT);
    authService.loginWithOAuth.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 0,
            statusText: 'Unknown Error',
          })
      )
    );

    await component.loginWithGoogle();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(feedbackHandlerService.error).toHaveBeenCalledWith(
      '0',
      'Unknown Error'
    );
  });

  it('keeps the Microsoft popup result flowing through the backend exchange', async () => {
    oauthService.loginWithMicrosoft.and.resolveTo({
      ...OAUTH_RESULT,
      user: { ...OAUTH_RESULT.user, provider: 'microsoft' },
    });
    authService.loginWithOAuth.and.returnValue(of(SESSION));

    await component.loginWithMicrosoft();

    expect(authService.loginWithOAuth).toHaveBeenCalledWith({
      idToken: 'firebase-id-token',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('does not call the backend or navigate when Firebase authentication fails', async () => {
    oauthService.loginWithGoogle.and.rejectWith(
      new Error('auth/popup-closed-by-user')
    );

    await component.loginWithGoogle();

    expect(authService.loginWithOAuth).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(feedbackHandlerService.error).toHaveBeenCalled();
  });

  it('keeps the classic login navigating after a successful backend login', () => {
    authService.login.and.returnValue(of(SESSION));
    component.form.setValue({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Passw0rd!',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('keeps the classic login error handling for rejected credentials', () => {
    authService.login.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          })
      )
    );
    component.form.setValue({
      email: 'user@example.com',
      password: 'wrong-password',
    });

    component.submit();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(feedbackHandlerService.error).toHaveBeenCalledWith(
      '401',
      'Unauthorized'
    );
  });
});
