/**
 * Interfaz base para usuarios del sistema
 * Contiene los atributos compartidos entre Citizen y Official
 */
export interface User {
  name: string;
  email: string;
  phone: string;
  status: string;
}
