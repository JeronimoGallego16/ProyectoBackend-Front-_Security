import { PlayerGender } from '../../business/player.model';

export interface CreatePlayerDTO {
  name: string;
  lastName: string;
  birthDate: string;
  gender: PlayerGender;
  email: string;
  identification: string;
}

export interface UpdatePlayerDTO {
  name?: string;
  lastName?: string;
  birthDate?: string;
  gender?: PlayerGender;
  email?: string;
  identification?: string;
  active?: boolean;
}
