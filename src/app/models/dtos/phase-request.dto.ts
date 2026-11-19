/**
 * Request payload used to create a final tournament phase.
 */
export interface CreateFinalPhaseDTO {
  name: string;
  order: number;
  tournamentId: number;
  type: 'FINAL';
  isThirdPlace: boolean;
}

/**
 * Request payload used to update a final phase.
 */
export interface UpdateFinalPhaseDTO {
  name?: string;
  order?: number;
  isThirdPlace?: boolean;
}
