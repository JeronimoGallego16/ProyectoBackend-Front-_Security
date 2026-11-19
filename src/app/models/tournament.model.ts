/**
 * Domain model representing a tournament returned by the business API.
 */
export interface Tournament {
  tournamentId: number;
  name: string;
  modality: string;
  startDate: string;
  endDate: string;
  status: string;
  capacity: number;
  sportId: number;
}
