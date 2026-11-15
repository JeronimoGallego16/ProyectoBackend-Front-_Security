/**
 * Domain model representing a sport returned by the backend.
 */
export interface Sport {
  sportId: number;
  name: string;
  description: string;
  parentSportId: number | null;
  teamSports: TeamSport[];
}

/**
 * Team assignment associated with a sport.
 */
export interface TeamSport {
  teamSportId: number;
  teamId: number;
  sportId: number;
}
