/**
 * Request payload used to create a match.
 */
export interface CreateMatchDTO {
  duration: string;
  state: string;
  homeTeamId: number;
  awayTeamId: number;
}

/**
 * Request payload used to update only changed match fields.
 */
export interface UpdateMatchDTO {
  duration?: string;
  state?: string;
  homeTeamId?: number;
  awayTeamId?: number;
}
