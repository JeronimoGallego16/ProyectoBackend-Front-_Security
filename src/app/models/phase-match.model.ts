/**
 * Match data exposed by the business API for tournament phase views.
 */
export interface PhaseMatch {
  matchId: number;
  duration: string;
  state: string;
  phaseId: number;
}
