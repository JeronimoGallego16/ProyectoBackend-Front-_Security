/**
 * Union type representing supported OAuth identity providers.
 */
export type OAuthProviderType = 'google' | 'microsoft' | 'github';

/**
 * Normalized user information obtained from an OAuth identity provider.
 * Only contains data originating from the provider.
 */
export interface OAuthUser {
  provider: OAuthProviderType;
  providerUserId: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}
