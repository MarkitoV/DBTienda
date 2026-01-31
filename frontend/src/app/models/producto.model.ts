export interface Producto {
  _id?: string;
  fechaCompra: Date | string;
  nombre: string;
  tipo: string;
  distribuidor: string;
  cantidad: number;
  precioTotal: number;
  precioPorPaquete?: number;
  unidadesPorPaquete: number;
  unidadesTotales?: number;
  precioPorUnidad?: number;
  precioVenta: number;
  gananciaPorUnidad?: number;
  ganancia?: number;
  gananciaPorcentaje?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
