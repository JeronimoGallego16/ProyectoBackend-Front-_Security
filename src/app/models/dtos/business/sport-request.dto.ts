/**
 * Request payload used to create a sport.
 */
export interface CreateSportDTO {
  name: string;
  description: string;
  parentSportId?: number | null;
}

/**
 * Request payload used to update only changed sport fields.
 */
export interface UpdateSportDTO {
  name?: string;
  description?: string;
  parentSportId?: number | null;
}
