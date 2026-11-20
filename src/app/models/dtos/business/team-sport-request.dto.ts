/**
 * Request payload used to create a team-to-sport assignment.
 */
export interface CreateTeamSportDTO {
  teamId: number;
  sportId: number;
}

/**
 * Request payload used to update only the team or sport of an assignment.
 */
export interface UpdateTeamSportDTO {
  teamId?: number;
  sportId?: number;
}
