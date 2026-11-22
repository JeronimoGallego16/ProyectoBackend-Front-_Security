export interface PlayerSkill {
  playerSkillId: number;
  playerId: number;
  skillId: number;
  level: number;
  observations: string | null;
  playerName: string;
  skillName: string;
}
