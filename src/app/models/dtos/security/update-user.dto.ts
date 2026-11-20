/**
 * Request payload for updating a user. An omitted password keeps the current
 * password according to the backend contract.
 */
export interface UpdateUserDTO {
  name: string;
  email: string;
  password?: string;
}
