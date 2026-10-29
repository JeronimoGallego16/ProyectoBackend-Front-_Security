/**
 * Request payload used to exchange a Firebase ID token for a backend session.
 * Property names must match the Spring Boot `OAuthLoginRequestDTO` JSON keys.
 */
export interface OAuthLoginRequestDTO {
  /**
   * Firebase ID token obtained after a successful social authentication.
   * It is only kept in memory for the duration of the exchange.
   */
  idToken: string;
}
