/**
 * Request payload used to create a match.
 */
export interface CreateMatchDTO {
  duration: string;
  state: string;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  phaseId: number;
  homeScore?: number | null;
  awayScore?: number | null;
  roundName?: string;
  bracketPosition?: number;
  nextMatchId?: number | null;
  isThirdPlace?: boolean;
}

/**
 * Request payload used to update only changed match fields.
 */
export interface UpdateMatchDTO {
  duration?: string;
  state?: string;
  homeTeamId?: number | null;
  awayTeamId?: number | null;
  phaseId?: number;
  homeScore?: number | null;
  awayScore?: number | null;
  roundName?: string | null;
  bracketPosition?: number | null;
  nextMatchId?: number | null;
  isThirdPlace?: boolean;
}

export interface MatchResultDTO {
  homeScore: number;
  awayScore: number;
}
