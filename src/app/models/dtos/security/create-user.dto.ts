/**
 * Request payload for creating a user. Password is never part of User reads.
 */
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}
