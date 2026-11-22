export type PlayerGender =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER'
  | 'PREFER_NOT_TO_SAY';

export interface Player {
  playerId: number;
  name: string;
  lastName: string;
  birthDate: string;
  gender: PlayerGender;
  email: string;
  identification: string;
  active: boolean;
}
