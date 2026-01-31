# Excel to JSON Converter

Este script permite extraer registros de compras desde un archivo Excel y convertirlos al formato JSON requerido por el proyecto DBTienda.

## Requisitos

- Python 3.x
- Dependencias: `pip install -r requirements.txt`

## Uso

1. Copia tu archivo Excel a esta carpeta.
2. Ejecuta el script pasando el nombre del archivo:
   ```bash
   python converter.py tu_archivo.xlsx
   ```
3. El resultado se guardará en `productos.json`.

## Mapeo de Columnas

El script busca las siguientes columnas exactas (según tu archivo):
- `FECHA DE COMPRA`
- `NOMBRE`
- `TIPO`
- `Distribuidor`
- `CANTIDAD`
- `PRECIO T.`
- `U. POR PAQUETE`
- `P. VENTA`

El script ignora automáticamente las columnas calculadas (como Ganancia, P. por Unidad, etc.) ya que el sistema las recalcula al importar.
