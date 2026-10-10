/**
 * Data Transfer Object used as the HTTP request payload for creating and
 * updating a {@link Role}.
 *
 * It intentionally excludes the `id` because the backend assigns it and it is
 * provided through the request URL for update operations.
 */
export interface RoleRequestDTO {
  name: string;
  description: string;
}
