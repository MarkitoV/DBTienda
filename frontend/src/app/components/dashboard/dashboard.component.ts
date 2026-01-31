import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import { ProductoFormComponent } from '../producto-form/producto-form.component';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexTooltip,
  ApexTheme,
  ApexYAxis,
  ApexMarkers
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  theme: ApexTheme;
  markers: ApexMarkers;
  colors: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatToolbarModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    FormsModule,
    NgApexchartsModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
    if (this.paginator) {
      this.localizePaginator();
    }
  }
  private paginator!: MatPaginator;
  dataSource = new MatTableDataSource<Producto>([]);
  displayedColumns: string[] = [
    'fechaCompra',
    'nombre',
    'tipo',
    'distribuidor',
    'cantidad',
    'unidadesPorPaquete',
    'precioTotal',
    'precioPorUnidad',
    'precioVenta',
    'ganancia',
    'acciones'
  ];

  totalInversion = 0;
  totalGananciaEstimada = 0;
  totalProductos = 0;

  // Filter properties
  filterValues = {
    nombre: '',
    tipo: '',
    distribuidor: '',
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null
  };

  nombreOptions: string[] = [];
  filteredNombres!: Observable<string[]>;

  // Subtotals
  subtotalInversion = 0;
  subtotalGanancia = 0;
  subtotalCount = 0;
  isFiltered = false;

  tipos: string[] = [];
  distribuidores: string[] = [];

  public chartOptions: Partial<ChartOptions>;
  public brushOptions: Partial<ChartOptions>;

  constructor(
    private productoService: ProductoService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [
        { name: "Precio por Unidad", data: [] },
        { name: "Precio de Venta", data: [] },
        { name: "Ganancia (%)", data: [] }
      ],
      chart: {
        id: "chart-main",
        height: 350,
        type: "area",
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        animations: {
          enabled: true
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "straight",
        width: [3, 3, 2]
      },
      markers: {
        size: 5,
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      title: {
        text: "Evolución de Precios y Margen de Ganancia",
        align: "left",
        style: {
          color: '#E6EAF0',
          fontSize: '16px'
        }
      },
      grid: {
        row: {
          colors: ["transparent", "transparent"],
          opacity: 0.5
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        xaxis: {
          lines: {
            show: true
          }
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#8A94A6'
          }
        }
      },
      yaxis: [
        {
          seriesName: "Precio por Unidad",
          title: {
            text: "Precio (BOB)",
            style: { color: '#5B7CFA', fontWeight: 600 }
          },
          labels: {
            style: { colors: '#8A94A6' },
            formatter: (val) => val ? val.toFixed(2) : ''
          }
        },
        {
          seriesName: "Precio de Venta",
          show: false
        },
        {
          seriesName: "Ganancia (%)",
          opposite: true,
          title: {
            text: "Ganancia (%)",
            style: { color: '#7BC8A4', fontWeight: 600 }
          },
          labels: {
            style: { colors: '#8A94A6' },
            formatter: (val) => val ? val.toFixed(1) + '%' : ''
          }
        }
      ],
      tooltip: {
        theme: 'dark',
        shared: true,
        intersect: false,
        x: {
          format: 'dd/MM/yy'
        },
        y: {
          formatter: function (val, { seriesIndex, dataPointIndex, w }) {
            if (val === undefined || val === null) return 'N/A';
            const seriesName = w.config.series[seriesIndex].name;

            if (seriesName.includes('%')) {
              const dataPoint = w.config.series[seriesIndex].data[dataPointIndex];
              const profitAmount = (dataPoint && typeof dataPoint === 'object' && 'profit' in dataPoint)
                ? (dataPoint as any).profit
                : null;

              let result = val.toFixed(1) + '%';
              if (profitAmount !== null) {
                result += ` (BOB ${profitAmount.toFixed(2)})`;
              }
              return result;
            }

            if (seriesName.includes('Unidades')) return val.toFixed(0);
            return 'BOB ' + val.toFixed(2);
          }
        }
      },
      theme: {
        mode: 'dark',
        palette: 'palette1'
      }
    };

    this.brushOptions = {
      series: [
        { name: "Precio por Unidad", data: [] }
      ],
      chart: {
        id: "chart-brush",
        height: 130,
        type: "area",
        brush: {
          target: "chart-main",
          enabled: true
        },
        selection: {
          enabled: true,
          fill: {
            color: "#5B7CFA",
            opacity: 0.1
          },
          stroke: {
            width: 1,
            color: "#5B7CFA"
          }
        },
        toolbar: {
          show: false
        }
      },
      colors: ["#5B7CFA"],
      stroke: {
        width: 2
      },
      xaxis: {
        type: "datetime",
        tooltip: {
          enabled: false
        },
        labels: {
          style: {
            colors: '#8A94A6'
          }
        }
      },
      yaxis: {
        tickAmount: 2,
        labels: {
          style: {
            colors: '#8A94A6'
          }
        }
      },
      theme: {
        mode: 'dark'
      }
    };
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = this.createFilter();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.loadProductos();
    this.setupAutocomplete();
  }

  setupAutocomplete() {
    this.filteredNombres = new Observable<string[]>(observer => {
      observer.next(this._filter(this.filterValues.nombre));
    }).pipe(
      startWith(''),
      map(value => this._filter(this.filterValues.nombre))
    );
  }

  onNombreChange() {
    this.applyFilter();
    this.setupAutocomplete(); // Refresh filtered options
  }

  private _filter(value: string): string[] {
    const filterValue = (value || '').toLowerCase();
    return this.nombreOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  ngAfterViewInit() {
    // Paginator is handled by the setter
  }

  createFilter(): (data: Producto, filter: string) => boolean {
    const filterFunction = (data: Producto, filter: string): boolean => {
      if (!filter) return true;

      let searchTerms;
      try {
        searchTerms = JSON.parse(filter);
      } catch (e) {
        return true;
      }

      const nameMatch = data.nombre.toLowerCase().includes(searchTerms.nombre.toLowerCase());
      const typeMatch = !searchTerms.tipo || data.tipo === searchTerms.tipo;
      const distMatch = !searchTerms.distribuidor || data.distribuidor === searchTerms.distribuidor;

      let dateMatch = true;
      if (searchTerms.fechaInicio || searchTerms.fechaFin) {
        const itemDate = new Date(data.fechaCompra);
        itemDate.setHours(0, 0, 0, 0);

        if (searchTerms.fechaInicio) {
          const start = new Date(searchTerms.fechaInicio);
          start.setHours(0, 0, 0, 0);
          dateMatch = dateMatch && itemDate >= start;
        }
        if (searchTerms.fechaFin) {
          const end = new Date(searchTerms.fechaFin);
          end.setHours(0, 0, 0, 0);
          dateMatch = dateMatch && itemDate <= end;
        }
      }

      return nameMatch && typeMatch && distMatch && dateMatch;
    };
    return filterFunction;
  }

  applyFilter() {
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.calculateSubtotals();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.filterValues = {
      nombre: '',
      tipo: '',
      distribuidor: '',
      fechaInicio: null,
      fechaFin: null
    };
    this.applyFilter();
  }

  calculateSubtotals() {
    const filteredData = this.dataSource.filteredData;
    this.subtotalInversion = filteredData.reduce((acc, p) => acc + (p.precioTotal || 0), 0);
    this.subtotalGanancia = filteredData.reduce((acc, p) => acc + (p.ganancia || 0), 0);
    this.subtotalCount = filteredData.length;

    this.isFiltered = this.filterValues.nombre !== '' ||
      this.filterValues.tipo !== '' ||
      this.filterValues.distribuidor !== '' ||
      this.filterValues.fechaInicio !== null ||
      this.filterValues.fechaFin !== null;

    this.updateChartData(filteredData);
  }

  updateChartData(data: Producto[]) {
    // Sort data by date for the chart
    let chartData: any[] = [...data].sort((a, b) =>
      new Date(a.fechaCompra).getTime() - new Date(b.fechaCompra).getTime()
    );

    // Check if only distributor filter is active
    const onlyDistributor = this.filterValues.distribuidor !== '' &&
      this.filterValues.nombre === '' &&
      this.filterValues.tipo === '' &&
      this.filterValues.fechaInicio === null &&
      this.filterValues.fechaFin === null;

    if (!this.isFiltered) {
      // Group by month
      const grouped: { [key: string]: any } = {};
      chartData.forEach(p => {
        const date = new Date(p.fechaCompra);
        // Set to first day of month for grouping
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!grouped[monthKey]) {
          const displayDate = new Date(date.getFullYear(), date.getMonth(), 1);
          grouped[monthKey] = {
            x: displayDate.getTime(),
            precioTotal: 0,
            ventaTotal: 0,
            unidadesTotales: 0
          };
        }
        grouped[monthKey].precioTotal += (p.precioTotal || 0);
        grouped[monthKey].ventaTotal += (p.precioVenta || 0) * (p.unidadesTotales || 0);
        grouped[monthKey].unidadesTotales += (p.unidadesTotales || 0);
      });

      chartData = Object.values(grouped).sort((a, b) => a.x - b.x).map(g => ({
        x: g.x,
        precioTotal: g.precioTotal,
        ventaTotal: g.ventaTotal,
        unidadesTotales: g.unidadesTotales,
        gananciaPorcentaje: g.precioTotal > 0 ? ((g.ventaTotal - g.precioTotal) / g.precioTotal) * 100 : 0,
        profit: g.ventaTotal - g.precioTotal
      }));

      this.chartOptions.series = [
        {
          name: "Inversión Total",
          type: "area",
          data: chartData.map(p => ({ x: p.x, y: p.precioTotal }))
        },
        {
          name: "Venta Total",
          type: "area",
          data: chartData.map(p => ({ x: p.x, y: p.ventaTotal }))
        },
        {
          name: "Unidades Totales",
          type: "column",
          data: chartData.map(p => ({ x: p.x, y: p.unidadesTotales }))
        },
        {
          name: "Ganancia (%)",
          type: "line",
          data: chartData.map(p => ({ x: p.x, y: p.gananciaPorcentaje, profit: p.profit }))
        }
      ];

      this.chartOptions.yaxis = [
        {
          seriesName: "Inversión Total",
          title: { text: "Totales (BOB)", style: { color: '#5B7CFA', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(2) : '' }
        },
        { seriesName: "Venta Total", show: false },
        {
          seriesName: "Unidades Totales",
          opposite: true,
          title: { text: "Unidades", style: { color: '#FEB019', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(0) : '' }
        },
        {
          seriesName: "Ganancia (%)",
          opposite: true,
          title: { text: "Ganancia (%)", style: { color: '#7BC8A4', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(1) + '%' : '' }
        }
      ];

    } else if (onlyDistributor) {
      const grouped: { [key: string]: any } = {};
      chartData.forEach(p => {
        const date = new Date(p.fechaCompra);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.getTime().toString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            x: date.getTime(),
            precioTotal: 0,
            ventaTotal: 0,
            unidadesTotales: 0
          };
        }
        grouped[dateKey].precioTotal += (p.precioTotal || 0);
        grouped[dateKey].ventaTotal += (p.precioVenta || 0) * (p.unidadesTotales || 0);
        grouped[dateKey].unidadesTotales += (p.unidadesTotales || 0);
      });

      chartData = Object.values(grouped).map(g => ({
        x: g.x,
        precioTotal: g.precioTotal,
        ventaTotal: g.ventaTotal,
        unidadesTotales: g.unidadesTotales,
        gananciaPorcentaje: g.precioTotal > 0 ? ((g.ventaTotal - g.precioTotal) / g.precioTotal) * 100 : 0,
        profit: g.ventaTotal - g.precioTotal
      }));

      this.chartOptions.series = [
        {
          name: "Inversión Total",
          type: "area",
          data: chartData.map(p => ({ x: p.x, y: p.precioTotal }))
        },
        {
          name: "Venta Total",
          type: "area",
          data: chartData.map(p => ({ x: p.x, y: p.ventaTotal }))
        },
        {
          name: "Unidades Totales",
          type: "column",
          data: chartData.map(p => ({ x: p.x, y: p.unidadesTotales }))
        },
        {
          name: "Ganancia (%)",
          type: "line",
          data: chartData.map(p => ({ x: p.x, y: p.gananciaPorcentaje, profit: p.profit }))
        }
      ];

      this.chartOptions.yaxis = [
        {
          seriesName: "Inversión Total",
          title: { text: "Totales (BOB)", style: { color: '#5B7CFA', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(2) : '' }
        },
        { seriesName: "Venta Total", show: false },
        {
          seriesName: "Unidades Totales",
          opposite: true,
          title: { text: "Unidades", style: { color: '#FEB019', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(0) : '' }
        },
        {
          seriesName: "Ganancia (%)",
          opposite: true,
          title: { text: "Ganancia (%)", style: { color: '#7BC8A4', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(1) + '%' : '' }
        }
      ];
    } else {
      chartData = chartData.map(p => ({
        x: new Date(p.fechaCompra).getTime(),
        precioPorUnidad: p.precioPorUnidad,
        precioVenta: p.precioVenta,
        gananciaPorcentaje: p.gananciaPorcentaje,
        profit: p.ganancia
      }));

      this.chartOptions.series = [
        {
          name: "Precio por Unidad",
          type: "area",
          data: chartData.map(p => ({ x: p.x, y: p.precioPorUnidad }))
        },
        {
          name: "Precio de Venta",
          type: "area",
          data: chartData.map(p => ({ x: p.x, y: p.precioVenta }))
        },
        {
          name: "Ganancia (%)",
          type: "line",
          data: chartData.map(p => ({ x: p.x, y: p.gananciaPorcentaje, profit: p.profit }))
        }
      ];

      this.chartOptions.yaxis = [
        {
          seriesName: "Precio por Unidad",
          title: { text: "Precio (BOB)", style: { color: '#5B7CFA', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(2) : '' }
        },
        { seriesName: "Precio de Venta", show: false },
        {
          seriesName: "Ganancia (%)",
          opposite: true,
          title: { text: "Ganancia (%)", style: { color: '#7BC8A4', fontWeight: 600 } },
          labels: { style: { colors: '#8A94A6' }, formatter: (val) => val ? val.toFixed(1) + '%' : '' }
        }
      ];
    }

    this.brushOptions.series = [
      {
        name: this.chartOptions.series[0].name,
        data: this.chartOptions.series[0].data as any
      }
    ];

    this.cdr.detectChanges();
  }

  localizePaginator() {
    if (!this.paginator) return;

    this.paginator._intl.itemsPerPageLabel = 'Items por página:';
    this.paginator._intl.nextPageLabel = 'Siguiente';
    this.paginator._intl.previousPageLabel = 'Anterior';
    this.paginator._intl.firstPageLabel = 'Primera página';
    this.paginator._intl.lastPageLabel = 'Última página';
    this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };
  }

  loadProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        // Sort by date descending (most recent first)
        data.sort((a, b) => {
          const dateA = new Date(a.fechaCompra).getTime();
          const dateB = new Date(b.fechaCompra).getTime();
          return dateB - dateA;
        });

        this.dataSource.data = data;
        this.extractFilterOptions(data);
        this.calculateTotals();
        this.calculateSubtotals();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading products', err)
    });
  }

  extractFilterOptions(data: Producto[]) {
    this.tipos = [...new Set(data.map(p => p.tipo))].sort();
    this.distribuidores = [...new Set(data.map(p => p.distribuidor))].sort();
    this.nombreOptions = [...new Set(data.map(p => p.nombre))].sort();
    this.setupAutocomplete();
  }

  calculateTotals(): void {
    const productos = this.dataSource.data;
    this.totalInversion = productos.reduce((acc, p) => acc + (p.precioTotal || 0), 0);
    this.totalGananciaEstimada = productos.reduce((acc, p) => acc + (p.ganancia || 0), 0);
    this.totalProductos = productos.length;
  }

  openForm(producto?: Producto): void {
    let initialData = producto || {};

    if (!producto && this.dataSource.data.length > 0) {
      // Find most recent date
      const dates = this.dataSource.data
        .map(p => new Date(p.fechaCompra))
        .filter(d => !isNaN(d.getTime()));

      if (dates.length > 0) {
        const mostRecentDate = new Date(Math.max(...dates.map(d => d.getTime())));
        initialData = { fechaCompra: mostRecentDate } as Producto;
      }
    }

    const dialogRef = this.dialog.open(ProductoFormComponent, {
      width: '600px',
      data: initialData,
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProductos();
      }
    });
  }

  deleteProducto(id: string): void {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.productoService.deleteProducto(id).subscribe({
        next: () => this.loadProductos(),
        error: (err) => console.error('Error deleting product', err)
      });
    }
  }
}
