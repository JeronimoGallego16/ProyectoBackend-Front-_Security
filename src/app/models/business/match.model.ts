/**
 * Domain model representing a match returned by the backend.
 */
export interface Match {
  matchId: number;
  duration: string;
  state: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  phaseId: number;
  homeScore?: number | null;
  awayScore?: number | null;
  roundName?: string | null;
  bracketPosition?: number | null;
  nextMatchId?: number | null;
  isThirdPlace?: boolean;
  resultRegistered: boolean;
}
