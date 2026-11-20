/**
 * Match data exposed by the business API for tournament phase views.
 */
export interface PhaseMatch {
  matchId: number;
  duration: string;
  state: string;
  phaseId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  roundName?: string | null;
  bracketPosition?: number | null;
  nextMatchId?: number | null;
  isThirdPlace?: boolean;
  resultRegistered: boolean;
}
