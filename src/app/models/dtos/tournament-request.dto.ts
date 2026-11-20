/**
 * Request payload used to create a tournament.
 */
export interface CreateTournamentDTO {
  name: string;
  modality: string;
  startDate: string;
  endDate: string;
  registrationEndDate?: string;
  status: string;
  capacity: number;
  sportId: number;
}

/**
 * Request payload used to update only changed tournament fields.
 */
export interface UpdateTournamentDTO {
  name?: string;
  modality?: string;
  startDate?: string;
  endDate?: string;
  registrationEndDate?: string | null;
  status?: string;
  capacity?: number;
  sportId?: number;
}
