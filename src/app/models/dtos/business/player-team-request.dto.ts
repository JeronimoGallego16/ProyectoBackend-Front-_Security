export interface AssignPlayerTeamDTO {
  playerId: number;
  startDate: string;
  endDate?: string;
}

export interface RetirePlayerTeamDTO {
  endDate: string;
}
