/**
 * Domain model representing a tournament returned by the business API.
 */
export interface Tournament {
  tournamentId: number;
  name: string;
  modality: string;
  startDate: string;
  endDate: string;
  registrationEndDate?: string | null;
  status: string;
  capacity: number;
  sportId: number;
}

export type TournamentStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'FINISHED'
  | 'CANCELLED';

export interface StandingTeam {
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface DevelopmentTeam {
  teamId: number;
  name: string;
  category?: string;
  groupId?: number | null;
}

export interface DevelopmentGroup {
  groupId: number;
  name?: string;
  letterOrNumber: string;
  maxTeams: number;
  teams: DevelopmentTeam[];
  standings: StandingTeam[];
}

export interface DevelopmentMatch {
  matchId: number;
  duration: string;
  state: string;
  phaseId?: number;
  homeTeamId?: number;
  homeTeamName?: string;
  awayTeamId?: number;
  awayTeamName?: string;
  homeTeam?: DevelopmentTeam | null;
  awayTeam?: DevelopmentTeam | null;
  homeScore?: number | null;
  awayScore?: number | null;
  roundName?: string | null;
  bracketPosition?: number | null;
  nextMatchId?: number | null;
  isThirdPlace?: boolean;
  resultRegistered: boolean;
}

export interface DevelopmentPhase {
  phaseId: number;
  name: string;
  order: number;
  tournamentId?: number;
  type: 'GROUP' | 'FINAL';
  isThirdPlace: boolean;
  groups: DevelopmentGroup[];
  matches: DevelopmentMatch[];
  bracket: DevelopmentMatch[];
}

export interface TournamentDevelopment {
  tournament: Tournament;
  phases: DevelopmentPhase[];
}
