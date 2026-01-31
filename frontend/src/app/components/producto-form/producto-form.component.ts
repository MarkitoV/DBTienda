import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter, MatNativeDateModule } from '@angular/material/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';

export class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.indexOf('/') > -1) {
      const str = value.split('/');
      if (str.length === 3) {
        const day = Number(str[0]);
        const month = Number(str[1]) - 1;
        let year = Number(str[2]);
        if (year < 100) {
          year += 2000;
        }
        return new Date(year, month, day);
      }
    }
    const timestamp = typeof value === 'number' ? value : Date.parse(value);
    return isNaN(timestamp) ? null : new Date(timestamp);
  }

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    }
    return date.toDateString();
  }
}

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatAutocompleteModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
  ],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoFormComponent implements OnInit {
  productoForm: FormGroup;
  isEdit = false;

  nombreOptions: string[] = [];
  tipoOptions: string[] = [];
  distribuidorOptions: string[] = [];
  allProductos: Producto[] = [];

  filteredNombres!: Observable<string[]>;
  filteredTipos!: Observable<string[]>;
  filteredDistribuidores!: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    public dialogRef: MatDialogRef<ProductoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Producto
  ) {
    this.isEdit = !!data._id;
    this.productoForm = this.fb.group({
      fechaCompra: [data.fechaCompra || new Date(), Validators.required],
      nombre: [data.nombre || '', Validators.required],
      tipo: [data.tipo || '', Validators.required],
      distribuidor: [data.distribuidor || '', Validators.required],
      cantidad: [data.cantidad || 1, [Validators.required, Validators.min(1)]],
      precioTotal: [data.precioTotal || 0, [Validators.required, Validators.min(0)]],
      unidadesPorPaquete: [data.unidadesPorPaquete || 1, [Validators.required, Validators.min(1)]],
      precioVenta: [data.precioVenta || 0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadOptions();

    this.filteredNombres = this.productoForm.get('nombre')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.nombreOptions)),
    );

    this.filteredTipos = this.productoForm.get('tipo')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.tipoOptions)),
    );

    this.filteredDistribuidores = this.productoForm.get('distribuidor')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.distribuidorOptions)),
    );
  }

  private loadOptions(): void {
    this.productoService.getProductos().subscribe(productos => {
      this.allProductos = productos;
      this.nombreOptions = [...new Set(productos.map(p => p.nombre))].sort();
      this.tipoOptions = [...new Set(productos.map(p => p.tipo))].sort();
      this.distribuidorOptions = [...new Set(productos.map(p => p.distribuidor))].sort();
    });
  }

  checkAutofill(nombre: string): void {
    if (!nombre || this.isEdit) return;

    // Find the most recent product with this name
    const lastProduct = this.allProductos
      .filter(p => p.nombre.toLowerCase() === nombre.trim().toLowerCase())
      .sort((a, b) => new Date(b.fechaCompra).getTime() - new Date(a.fechaCompra).getTime())[0];

    if (lastProduct) {
      this.productoForm.patchValue({
        tipo: lastProduct.tipo,
        distribuidor: lastProduct.distribuidor,
        unidadesPorPaquete: lastProduct.unidadesPorPaquete,
        precioVenta: lastProduct.precioVenta
      });
    }
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      const productoData = this.productoForm.value;

      if (this.isEdit) {
        this.productoService.updateProducto(this.data._id!, productoData).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('Error updating product', err)
        });
      } else {
        this.productoService.createProducto(productoData).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('Error creating product', err)
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
