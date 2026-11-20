/**
 * Domain model representing a team's registration in a tournament.
 */
export interface Registration {
  registrationId: number;
  registrationDate: string;
  tournamentId: number;
  teamId: number;
}
