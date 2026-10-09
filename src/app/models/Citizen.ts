import { User } from './User';

/**
 * Interfaz para ciudadanos
 * Hereda de User e incluye propiedades específicas de ciudadanos
 */
export interface Citizen extends User {
  id_citizen: number;
  address: string;
  latitude: number;
  longitude: number;
}
