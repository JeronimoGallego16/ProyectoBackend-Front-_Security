/**
 * Payload used to create or update a user profile in the backend.
 */
export interface ProfileRequestDTO {
  phone: string;
  birthDate: string; // ISO-8601 date (yyyy-MM-dd)
}
