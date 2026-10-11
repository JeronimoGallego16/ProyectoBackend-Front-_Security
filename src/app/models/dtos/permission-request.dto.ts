/**
 * Data Transfer Object used as the HTTP request payload for creating and
 * updating a {@link Permission}.
 *
 * It intentionally excludes the `id` because the backend assigns it and it is
 * provided through the request URL for update operations.
 */
export interface PermissionRequestDTO {
  url: string;
  method: string;
}
