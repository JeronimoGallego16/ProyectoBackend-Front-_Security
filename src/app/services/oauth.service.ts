/* OAuth service for Firebase-based social authentication.*/
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  User,
  UserCredential
} from '@angular/fire/auth';
import { OAuthProviderType, OAuthUser } from '../models/oauth/oauth-user.model';
import { OAuthResult } from '../models/oauth/oauth-result.model';

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  /**
   * Firebase Auth instance injected via Angular DI.
   */
  private readonly auth: Auth = inject(Auth);

  /**
   * Angular injector used to keep AngularFire calls in an injection context.
   */
  private readonly injector = inject(Injector);

  /**
   * Temporary marker key for Microsoft redirect flow.
   * This marker must not contain tokens or session information.
   */
  private readonly microsoftRedirectMarkerKey = 'oauth_ms_redirect_pending';

  /**
   * Executes an AngularFire operation within Angular's injection context.
   *
   * @param operation - Firebase operation to execute.
   * @returns Promise returned by the Firebase operation.
   */
  private runFirebaseOperation<T>(operation: () => Promise<T>): Promise<T> {
    return runInInjectionContext(this.injector, operation);
  }

  /**
   * Builds the normalized OAuthUser from a Firebase User and provider.
   * 
   * @param firebaseUser - Authenticated Firebase user.
   * @param provider - OAuth provider type.
   * @returns Normalized OAuthUser.
   */
  private mapFirebaseUserToOAuthUser(firebaseUser: User, provider: OAuthProviderType): OAuthUser {
    return {
      provider: provider,
      providerUserId: firebaseUser.uid,
      displayName: firebaseUser.displayName ?? null,
      email: firebaseUser.email ?? null,
      photoUrl: firebaseUser.photoURL ?? null
    };
  }

  /**
   * Extracts OAuthResult from a UserCredential.
   * Obtains the Firebase ID token via getIdToken().
   * 
   * @param credential - Firebase user credential.
   * @param provider - OAuth provider type.
   * @returns Promise resolving to OAuthResult.
   */
  private async buildOAuthResultFromCredential(credential: UserCredential, provider: OAuthProviderType): Promise<OAuthResult> {
    const firebaseUser = credential.user;
    const idToken = await firebaseUser.getIdToken();
    const user = this.mapFirebaseUserToOAuthUser(firebaseUser, provider);
    return {
      user: user,
      idToken: idToken
    };
  }

  /**
   * Extracts OAuthResult from a Firebase User (used in redirect flows).
   * Obtains the Firebase ID token via getIdToken().
   * 
   * @param firebaseUser - Authenticated Firebase user.
   * @param provider - OAuth provider type.
   * @returns Promise resolving to OAuthResult.
   */
  private async buildOAuthResultFromUser(firebaseUser: User, provider: OAuthProviderType): Promise<OAuthResult> {
    const idToken = await firebaseUser.getIdToken();
    const user = this.mapFirebaseUserToOAuthUser(firebaseUser, provider);
    return {
      user: user,
      idToken: idToken
    };
  }

  /**
   * Initiates Google OAuth sign-in using popup.
   * 
   * @returns Promise resolving to OAuthResult.
   * @throws Propagates errors from Firebase Auth.
   */
  public async loginWithGoogle(): Promise<OAuthResult> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await this.runFirebaseOperation(() => signInWithPopup(this.auth, provider));
    return this.buildOAuthResultFromCredential(credential, 'google');
  }

  /**
   * Initiates GitHub OAuth sign-in using popup.
   * 
   * @returns Promise resolving to OAuthResult.
   * @throws Propagates errors from Firebase Auth.
   */
  public async loginWithGithub(): Promise<OAuthResult> {
    const provider = new GithubAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await this.runFirebaseOperation(() => signInWithPopup(this.auth, provider));
    return this.buildOAuthResultFromCredential(credential, 'github');
  }

  /**
   * Initiates Microsoft OAuth sign-in.
   * Tries popup first. If popup is blocked, cancelled or not allowed by browser restrictions,
   * falls back to redirect flow and sets a non-sensitive marker.
   * 
   * @returns Promise resolving to OAuthResult (only when popup succeeds).
   * @throws Propagates errors when popup fails for reasons other than fallback cases,
   *         or when redirect initiation fails.
   */
  public async loginWithMicrosoft(): Promise<OAuthResult> {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const credential = await this.runFirebaseOperation(() => signInWithPopup(this.auth, provider));
      return this.buildOAuthResultFromCredential(credential, 'microsoft');
    } catch (error: unknown) {
      const errorCode = this.extractErrorCode(error);
      if (
        errorCode === 'auth/popup-blocked' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/popup-closed-by-user'
      ) {
        // Mark redirect flow as pending (non-sensitive marker only)
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(this.microsoftRedirectMarkerKey, 'pending');
          }
        } catch {
          // Do not fail the flow if storage is unavailable
        }
        await this.runFirebaseOperation(() => signInWithRedirect(this.auth, provider));
        // When redirect is used, result will be obtained via handleMicrosoftRedirect()
        throw new Error('MICROSOFT_REDIRECT_INITIATED');
      }
      throw error;
    }
  }

  /**
   * Processes pending Microsoft redirect result.
   * Must be called on app initialization/path where redirect returns.
   * 
   * @returns Promise resolving to OAuthResult if a redirect result exists, otherwise null.
   * @throws Propagates errors encountered while processing redirect result.
   */
  public async handleMicrosoftRedirect(): Promise<OAuthResult | null> {
    let hasMarker = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        hasMarker = window.localStorage.getItem(this.microsoftRedirectMarkerKey) === 'pending';
      }
    } catch {
      hasMarker = false;
    }

    try {
      const result = await this.runFirebaseOperation(() => getRedirectResult(this.auth));
      if (result && result.user) {
        // Clear marker on success
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(this.microsoftRedirectMarkerKey);
          }
        } catch {
          // Ignore storage cleanup errors
        }
        return this.buildOAuthResultFromUser(result.user, 'microsoft');
      }
    } catch (error: unknown) {
      // Clear marker on error and propagate
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(this.microsoftRedirectMarkerKey);
        }
      } catch {
        // Ignore
      }
      throw error;
    }

    // If no result from getRedirectResult but marker exists, clear marker defensively
    if (hasMarker) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(this.microsoftRedirectMarkerKey);
        }
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * Safely extracts error code from unknown error objects.
   * 
   * @param error - Unknown error.
   * @returns Error code string if present, otherwise undefined.
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: unknown }).code;
      if (typeof code === 'string') {
        return code;
      }
    }
    return undefined;
  }
}
