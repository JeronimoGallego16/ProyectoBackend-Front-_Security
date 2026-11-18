/**
 * Domain model representing a match returned by the backend.
 */
export interface Match {
  matchId: number;
  duration: string;
  state: string;
  homeTeamId: number;
  awayTeamId: number;
  phaseId?: number | null;
}
