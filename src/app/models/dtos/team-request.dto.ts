/**
 * Request payload used to create a team.
 */
export interface CreateTeamDTO {
  name: string;
  category: string;
}

/**
 * Request payload used to update only changed team fields.
 */
export interface UpdateTeamDTO {
  name?: string;
  category?: string;
}
