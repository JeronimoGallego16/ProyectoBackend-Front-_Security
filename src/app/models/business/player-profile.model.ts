import { Player } from './player.model';
import { PlayerSkill } from './player-skill.model';
import { PlayerTeam } from './player-team.model';

export interface PlayerProfile {
  player: Player;
  skills: PlayerSkill[];
  teams: PlayerTeam[];
}
