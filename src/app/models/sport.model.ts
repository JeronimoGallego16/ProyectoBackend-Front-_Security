/**
 * Domain model representing a sport returned by the backend.
 */
export interface Sport {
  sportId: number;
  name: string;
  description: string;
  parentSportId: number | null;
}
