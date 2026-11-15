/**
 * Domain model representing a team returned by the backend.
 */
export interface Team {
  teamId: number;
  name: string;
  category: string;
  groupId?: number | null;
}
