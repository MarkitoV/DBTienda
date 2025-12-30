import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

import productoRoutes from './routes/productoRoutes';

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('API de DBTienda funcionando');
});

app.use('/api/productos', productoRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dbtienda';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error('Error conectando a MongoDB:', error);
  });
