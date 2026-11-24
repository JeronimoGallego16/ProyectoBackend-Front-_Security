/**
 * Domain model representing a tournament phase.
 */
export interface Phase {
  phaseId: number;
  name: string;
  order: number;
  tournamentId: number;
  type: string;
  isThirdPlace: boolean;
  expectedMatchCount?: number | null;
}
