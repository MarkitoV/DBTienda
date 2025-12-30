import mongoose, { Schema, Document } from 'mongoose';

export interface IProducto extends Document {
  fechaCompra: Date;
  nombre: string;
  tipo: string;
  distribuidor: string;
  cantidad: number;
  precioTotal: number;
  precioPorPaquete: number;
  unidadesPorPaquete: number;
  unidadesTotales: number;
  precioPorUnidad: number;
  precioVenta: number;
  gananciaPorUnidad: number;
  ganancia: number;
  gananciaPorcentaje: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductoSchema: Schema = new Schema({
  fechaCompra: { type: Date, required: true },
  nombre: { type: String, required: true },
  tipo: { type: String, required: true },
  distribuidor: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioTotal: { type: Number, required: true },
  precioPorPaquete: { type: Number },
  unidadesPorPaquete: { type: Number, required: true },
  unidadesTotales: { type: Number },
  precioPorUnidad: { type: Number },
  precioVenta: { type: Number, required: true },
  gananciaPorUnidad: { type: Number },
  ganancia: { type: Number },
  gananciaPorcentaje: { type: Number }
}, {
  timestamps: true
});

// Pre-save hook to calculate fields
ProductoSchema.pre('save', function (this: IProducto) {
  // Precio por Paquete = Precio Total / Cantidad
  if (this.cantidad > 0) {
    this.precioPorPaquete = Number((this.precioTotal / this.cantidad).toFixed(2));
  } else {
    this.precioPorPaquete = 0;
  }

  // Unidades Totales = Cantidad * Unidades por Paquete
  this.unidadesTotales = this.cantidad * this.unidadesPorPaquete;

  // Precio por Unidad = Precio Total / Unidades Totales
  if (this.unidadesTotales > 0) {
    this.precioPorUnidad = Number((this.precioTotal / this.unidadesTotales).toFixed(2));
  } else {
    this.precioPorUnidad = 0;
  }

  // Ganancia por Unidad = Precio Venta - Precio por Unidad
  const precioUnidad = this.precioPorUnidad || 0;
  this.gananciaPorUnidad = Number((this.precioVenta - precioUnidad).toFixed(2));

  // Ganancia Total = Ganancia por Unidad * Unidades Totales
  this.ganancia = Number((this.gananciaPorUnidad * this.unidadesTotales).toFixed(2));

  // Ganancia en Porcentaje = (Ganancia por Unidad / Precio por Unidad) * 100
  if (precioUnidad > 0) {
    this.gananciaPorcentaje = Number(((this.gananciaPorUnidad / precioUnidad) * 100).toFixed(2));
  } else {
    this.gananciaPorcentaje = 0;
  }
});

export default mongoose.model<IProducto>('Producto', ProductoSchema);
