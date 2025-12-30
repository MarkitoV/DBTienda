import { Request, Response } from 'express';
import Producto from '../models/Producto';

export const getProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const productos = await Producto.find().sort({ fechaCompra: -1 });
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos', error });
  }
};

export const getProductoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error });
  }
};

export const createProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoProducto = new Producto(req.body);
    const productoGuardado = await nuevoProducto.save();
    res.status(201).json(productoGuardado);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el producto', error });
  }
};

export const updateProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    // We use findById and then save() to trigger the pre-save hook for recalculations
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }

    Object.assign(producto, req.body);
    const productoActualizado = await producto.save();

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el producto', error });
  }
};

export const deleteProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!productoEliminado) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto', error });
  }
};
