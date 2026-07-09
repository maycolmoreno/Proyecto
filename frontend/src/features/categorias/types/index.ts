// Tipos del dominio de Categorías — espejo de los DTOs de Fase 4 (Shared Kernel).
export interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  estado: 'ACTIVA' | 'INACTIVA';
}
