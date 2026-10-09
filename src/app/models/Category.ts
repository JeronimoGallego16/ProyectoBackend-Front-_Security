/**
 * Interfaz para categorías
 * Las categorías pueden tener subcategorías mediante id_parent_category
 */
export interface Category {
  id_category: number;
  name: string;
  description: string;
  image_url: string | null;
  id_parent_category: number | null;
  status: string;
}
