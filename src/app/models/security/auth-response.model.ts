export interface AuthSession {
  id: number;
  name: string;
  email: string;
}

export type AuthResponse = AuthSession;
