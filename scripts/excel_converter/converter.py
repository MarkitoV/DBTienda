import pandas as pd
import json
import os
import sys
from datetime import datetime

def convert_excel_to_json(excel_file, output_json='productos.json'):
    if not os.path.exists(excel_file):
        print(f"Error: No se encontró el archivo {excel_file}")
        return

    try:
        # Read Excel file
        print(f"Leyendo archivo: {excel_file}...")
        print("Iniciando pd.read_excel...")
        # Use engine='openpyxl' for .xlsm files
        df = pd.read_excel(excel_file, engine='openpyxl')
        print(f"Archivo leído. Filas encontradas: {len(df)}")
        
        # Basic cleaning: Drop rows where 'NOMBRE' is empty to avoid processing empty Excel rows
        initial_count = len(df)
        if 'NOMBRE' not in df.columns:
            print(f"Error: La columna 'NOMBRE' no existe. Columnas disponibles: {df.columns.tolist()}")
            return
        
        df = df.dropna(subset=['NOMBRE'])

        df = df.fillna('')
        
        dropped_count = initial_count - len(df)
        if dropped_count > 0:
            print(f"Se ignoraron {dropped_count} filas vacías o sin nombre.")
        
        productos = []
        total_rows = len(df)
        print(f"Procesando {total_rows} filas...")
        
        for i, (index, row) in enumerate(df.iterrows()):
            if i % 100 == 0 and i > 0:
                print(f"Procesado: {i}/{total_rows}...")
            
            # Mapping based on the provided Excel headers

            # We only extract non-calculated fields as requested
            
            # Handle Date
            fecha_val = row.get('FECHA DE COMPRA', '')
            if isinstance(fecha_val, datetime):
                fecha_iso = fecha_val.isoformat()
            elif isinstance(fecha_val, str) and fecha_val.strip():
                try:
                    # Try parsing dd/mm/yyyy
                    fecha_iso = datetime.strptime(fecha_val.strip(), '%d/%m/%Y').isoformat()
                except:
                    fecha_iso = datetime.now().isoformat()
            else:
                fecha_iso = datetime.now().isoformat()

            producto = {
                "fechaCompra": fecha_iso,
                "nombre": str(row.get('NOMBRE', '')),
                "tipo": str(row.get('TIPO', '')),
                "distribuidor": str(row.get('Distribuidor', '')),
                "cantidad": int(row.get('CANTIDAD', 0)) if row.get('CANTIDAD') != '' else 0,
                "precioTotal": float(row.get('PRECIO T.', 0)) if row.get('PRECIO T.') != '' else 0.0,
                "unidadesPorPaquete": int(row.get('U. POR PAQUETE', 1)) if row.get('U. POR PAQUETE') != '' else 1,
                "precioVenta": float(row.get('P. VENTA', 0)) if row.get('P. VENTA') != '' else 0.0
            }
            
            # Only add if it has a name
            if producto["nombre"]:
                productos.append(producto)
            
        # Save to JSON
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(productos, f, ensure_ascii=False, indent=2)
            
        print(f"¡Éxito! Se han convertido {len(productos)} registros a {output_json}")
        
    except Exception as e:
        print(f"Error durante la conversión: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python converter.py <archivo_excel.xlsx>")
    else:
        convert_excel_to_json(sys.argv[1])
