/**
 * Request payload used to register one team in one tournament.
 */
export interface CreateRegistrationDTO {
  tournamentId: number;
  teamId: number;
  registrationDate?: string;
}
