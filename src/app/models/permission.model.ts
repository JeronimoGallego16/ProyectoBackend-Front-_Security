/**
 * Domain model that represents a security permission returned by the backend.
 *
 * A permission associates an HTTP method with a protected URL so access can be
 * granted or denied per endpoint.
 */
export interface Permission {
  id: number;
  url: string;
  method: string;
  entity: string;
}
