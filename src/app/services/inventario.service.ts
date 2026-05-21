import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Stock, MovInventario } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class InventarioService {

  private mockStock: Stock[] = [
    { id_stock: 1, id_producto: 1, id_bodega: 1, producto: 'Smartphone Samsung Galaxy A54', sku: 'SKU-1001', bodega: 'Bodega Norte',        cant_disponible: 85,  cant_minima: 20, cant_maxima: 200 },
    { id_stock: 2, id_producto: 2, id_bodega: 1, producto: 'Audífonos Sony WH-1000XM5',     sku: 'SKU-1002', bodega: 'Bodega Norte',        cant_disponible: 12,  cant_minima: 15, cant_maxima: 100 },
    { id_stock: 3, id_producto: 3, id_bodega: 2, producto: 'Silla Ergonómica Premium',       sku: 'SKU-2001', bodega: 'Bodega Sur',          cant_disponible: 0,   cant_minima: 10, cant_maxima: 80  },
    { id_stock: 4, id_producto: 4, id_bodega: 2, producto: 'Monitor LG UltraWide 34"',       sku: 'SKU-2002', bodega: 'Bodega Sur',          cant_disponible: 34,  cant_minima: 10, cant_maxima: 60  },
    { id_stock: 5, id_producto: 5, id_bodega: 3, producto: 'Caja de embalaje reforzada L',   sku: 'SKU-3001', bodega: 'Bodega Puerto',       cant_disponible: 850, cant_minima: 200,cant_maxima: 2000},
    { id_stock: 6, id_producto: 6, id_bodega: 4, producto: 'Termo Stanley Adventure 1L',     sku: 'SKU-4001', bodega: 'Bodega Eje Cafetero', cant_disponible: 7,   cant_minima: 15, cant_maxima: 120 },
  ];

  private mockMovimientos: MovInventario[] = [
    { id_movimiento: 1, id_producto: 1, id_bodega: 1, producto: 'Smartphone Samsung Galaxy A54', bodega: 'Bodega Norte',        tipo_movimiento: 'entrada',       cantidad: 50,  fecha: '2025-04-15T09:00:00', referencia: 'OC-2025-001', usuario: 'admin@softyz.co' },
    { id_movimiento: 2, id_producto: 2, id_bodega: 1, producto: 'Audífonos Sony WH-1000XM5',     bodega: 'Bodega Norte',        tipo_movimiento: 'salida',        cantidad: 8,   fecha: '2025-04-16T11:30:00', referencia: 'PED-9820',    usuario: 'warehouse@softyz.co' },
    { id_movimiento: 3, id_producto: 3, id_bodega: 2, producto: 'Silla Ergonómica Premium',       bodega: 'Bodega Sur',          tipo_movimiento: 'salida',        cantidad: 5,   fecha: '2025-04-17T14:00:00', referencia: 'PED-9825',    usuario: 'warehouse@softyz.co' },
    { id_movimiento: 4, id_producto: 5, id_bodega: 3, producto: 'Caja de embalaje reforzada L',   bodega: 'Bodega Puerto',       tipo_movimiento: 'entrada',       cantidad: 500, fecha: '2025-04-17T08:00:00', referencia: 'OC-2025-002', usuario: 'admin@softyz.co' },
    { id_movimiento: 5, id_producto: 6, id_bodega: 4, producto: 'Termo Stanley Adventure 1L',     bodega: 'Bodega Eje Cafetero', tipo_movimiento: 'ajuste',        cantidad: -3,  fecha: '2025-04-18T16:45:00', referencia: 'AJ-2025-01',  usuario: 'operador@softyz.co' },
    { id_movimiento: 6, id_producto: 4, id_bodega: 2, producto: 'Monitor LG UltraWide 34"',       bodega: 'Bodega Sur',          tipo_movimiento: 'transferencia', cantidad: 10,  fecha: '2025-04-19T10:00:00', referencia: 'TRF-2025-01', usuario: 'system_auto' },
  ];

  private stockSubject = new BehaviorSubject<Stock[]>(this.calcularEstados(this.mockStock));
  private movimientosSubject = new BehaviorSubject<MovInventario[]>(this.mockMovimientos);

  stock$ = this.stockSubject.asObservable();
  movimientos$ = this.movimientosSubject.asObservable();

  private calcularEstados(stocks: Stock[]): Stock[] {
    return stocks.map(s => ({
      ...s,
      estado: s.cant_disponible === 0
        ? 'agotado'
        : s.cant_disponible < s.cant_minima
        ? 'bajo'
        : s.cant_disponible > s.cant_maxima
        ? 'exceso'
        : 'normal',
    }));
  }

  getPorcentaje(s: Stock): number {
    if (s.cant_maxima === 0) return 0;
    return Math.min(100, Math.round((s.cant_disponible / s.cant_maxima) * 100));
  }

  getAll(): Observable<Stock[]> { return this.stock$; }
  getMovimientos(): Observable<MovInventario[]> { return this.movimientos$; }

  registrarMovimiento(mov: Omit<MovInventario, 'id_movimiento'>): void {
    const movs = this.movimientosSubject.value;
    const newId = Math.max(...movs.map(m => m.id_movimiento), 0) + 1;
    this.movimientosSubject.next([{ ...mov, id_movimiento: newId }, ...movs]);
  }

  actualizarStock(id_stock: number, changes: Partial<Stock>): void {
    const raw = this.stockSubject.value.map(s =>
      s.id_stock === id_stock ? { ...s, ...changes } : s
    );
    this.stockSubject.next(this.calcularEstados(raw));
  }
}
