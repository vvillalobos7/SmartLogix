import { TestBed } from '@angular/core/testing';
import { InventarioService } from './inventario.service';
import { Stock, MovInventario } from '../interfaces/models';
import { firstValueFrom } from 'rxjs';

describe('InventarioService', () => {
  let service: InventarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InventarioService],
    });
    service = TestBed.inject(InventarioService);
  });

  it('should be created and return mock stock data with calculated states', async () => {
    expect(service).toBeTruthy();
    const stocks = await firstValueFrom(service.getAll());
    expect(stocks.length).toBeGreaterThan(0);
    
    // El stock con id_stock 3 tiene cant_disponible = 0
    const stockAgotado = stocks.find(s => s.id_stock === 3);
    expect(stockAgotado?.estado).toBe('agotado');

    // El stock con id_stock 2 tiene cant_disponible = 12, cant_minima = 15
    const stockBajo = stocks.find(s => s.id_stock === 2);
    expect(stockBajo?.estado).toBe('bajo');
  });

  it('should calculate percentages correctly', () => {
    const mockStockNormal: Stock = {
      id_stock: 1, id_producto: 1, id_bodega: 1,
      producto: 'P1', sku: 'SKU-1', bodega: 'B1',
      cant_disponible: 50, cant_minima: 10, cant_maxima: 100
    };
    expect(service.getPorcentaje(mockStockNormal)).toBe(50);

    const mockStockZeroMax: Stock = {
      id_stock: 1, id_producto: 1, id_bodega: 1,
      producto: 'P1', sku: 'SKU-1', bodega: 'B1',
      cant_disponible: 50, cant_minima: 10, cant_maxima: 0
    };
    expect(service.getPorcentaje(mockStockZeroMax)).toBe(0);
  });

  it('should register movements', async () => {
    const newMovement: Omit<MovInventario, 'id_movimiento'> = {
      id_producto: 1, id_bodega: 1, producto: 'P1',
      bodega: 'B1', tipo_movimiento: 'entrada',
      cantidad: 10, fecha: '2025-04-20T10:00:00',
      referencia: 'REF-1', usuario: 'user@test.com'
    };

    service.registrarMovimiento(newMovement);

    const movs = await firstValueFrom(service.getMovimientos());
    expect(movs[0].id_movimiento).toBeGreaterThan(0);
    expect(movs[0].producto).toBe('P1');
    expect(movs[0].cantidad).toBe(10);
  });

  it('should update stock and recalculate states', async () => {
    // Actualizar id_stock 3 (que estaba agotado) a cant_disponible = 50 (normal)
    service.actualizarStock(3, { cant_disponible: 50 });

    const stocks = await firstValueFrom(service.getAll());
    const stock = stocks.find(s => s.id_stock === 3);
    expect(stock?.cant_disponible).toBe(50);
    expect(stock?.estado).toBe('normal');
  });
});
