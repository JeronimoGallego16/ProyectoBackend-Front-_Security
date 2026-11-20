/**
 * Result object returned by the OAuth service after a successful authentication flow.
 */
import { OAuthUser } from './oauth-user.model';

export interface OAuthResult {
  user: OAuthUser;
  idToken: string;
}
