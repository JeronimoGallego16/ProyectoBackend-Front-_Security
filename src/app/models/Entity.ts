/**
 * Interfaz para entidades (organizaciones/instituciones)
 */
export interface Entity {
  id_entity: number;
  name: string;
  nit: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string | null;
  status: string;
}
