import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Producto from '../models/Producto';

// Cargar variables de entorno desde el backend
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dbtienda';

async function importData() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    const jsonPath = path.resolve(__dirname, '../../../scripts/excel_converter/productos.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`No se encontró el archivo JSON en: ${jsonPath}`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`Leídos ${data.length} productos del archivo JSON.`);

    // Limpiar la colección antes de importar
    console.log('Limpiando colección de productos...');
    const deleteResult = await Producto.deleteMany({});
    console.log(`Colección limpia. Se eliminaron ${deleteResult.deletedCount} registros.`);

    const cleanItems = data.map((item: any, index: number) => {
      // Asegurar que todos los campos requeridos tengan valores
      let fecha = new Date(item.fechaCompra);
      if (isNaN(fecha.getTime())) {
        fecha = new Date(); // Fallback a hoy si la fecha es inválida
      }

      return {
        fechaCompra: fecha,
        nombre: item.nombre || 'Sin nombre',
        tipo: item.tipo || 'Otros',
        distribuidor: item.distribuidor || 'General',
        cantidad: typeof item.cantidad === 'number' ? item.cantidad : 0,
        precioTotal: typeof item.precioTotal === 'number' ? item.precioTotal : 0,
        unidadesPorPaquete: typeof item.unidadesPorPaquete === 'number' ? item.unidadesPorPaquete : 1,
        precioVenta: typeof item.precioVenta === 'number' ? item.precioVenta : 0
      };
    });

    console.log(`Insertando ${cleanItems.length} productos en la base de datos...`);
    const insertResult: any = await Producto.create(cleanItems);
    console.log(`Importación completada con éxito. Total: ${insertResult.length} productos insertados.`);

    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error fatal durante la importación:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

importData();
