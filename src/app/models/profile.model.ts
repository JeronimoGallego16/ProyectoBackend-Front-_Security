import { User } from './user.model';

/**
 * Profile managed by the security microservice. It is related one-to-one
 * with a {@link User}.
 */
export interface Profile {
  id: number;
  phone: string;
  birthDate: string; // ISO-8601 date (yyyy-MM-dd)
  profileImageUrl: string | null;
  userId: number;
  user?: User;
}
