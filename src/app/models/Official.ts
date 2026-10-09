import { User } from './User';

/**
 * Interfaz para funcionarios
 * Hereda de User e incluye propiedades específicas de funcionarios
 */
export interface Official extends User {
  id_entity: number;
  role: string;
  last_latitude: number;
  last_longitude: number;
  last_gps_update: string;
  gps_active: boolean;
}
