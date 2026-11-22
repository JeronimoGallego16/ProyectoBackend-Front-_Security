export interface AssignPlayerSkillDTO {
  skillId: number;
  level: number;
  observations?: string;
}

export interface UpdatePlayerSkillDTO {
  level?: number;
  observations?: string;
}
