import { TestBed } from '@angular/core/testing';
import { OrdenService } from './orden.service';
import { Pedido } from '../interfaces/models';
import { firstValueFrom } from 'rxjs';

describe('OrdenService', () => {
  let service: OrdenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdenService],
    });
    service = TestBed.inject(OrdenService);
  });

  it('should be created and return initial orders list', async () => {
    expect(service).toBeTruthy();
    const pedidos = await firstValueFrom(service.getAll());
    expect(pedidos.length).toBe(6);
  });

  it('should find an order by id', () => {
    const pedido = service.getById(9820);
    expect(pedido).toBeDefined();
    expect(pedido?.cliente).toBe('María Torres');
  });

  it('should get order lines with calculated subtotals', () => {
    const lineas = service.getLineasByPedido(9820);
    expect(lineas.length).toBe(2);
    // Line 1: cantidad 2, precio_unitario 1250000 -> subtotal 2500000
    expect(lineas[0].subtotal).toBe(2500000);
  });

  it('should create a new order and map its state properties', async () => {
    const newPedido: Omit<Pedido, 'id_pedido'> = {
      fecha_pedido: '2025-04-20T10:00:00',
      id_estado: 3, // Aprobado
      total: 100000,
      id_cliente: 101,
      cliente: 'Juan Perez',
      email_cliente: 'juan@perez.com',
      id_estado_envio: 1,
      estado_envio: 'Preparando'
    };

    service.create(newPedido);

    const pedidos = await firstValueFrom(service.getAll());
    const created = pedidos.find(p => p.cliente === 'Juan Perez');
    expect(created).toBeDefined();
    expect(created?.id_pedido).toBeGreaterThan(9824);
    expect(created?.estado).toBe('Aprobado');
    expect(created?.estado_color).toBe('green');
  });

  it('should update an order and map updated state properties', async () => {
    // Actualizar pedido 9820 a estado 3 (Aprobado)
    service.update(9820, { id_estado: 3 });

    const pedidos = await firstValueFrom(service.getAll());
    const updated = pedidos.find(p => p.id_pedido === 9820);
    expect(updated?.estado).toBe('Aprobado');
    expect(updated?.estado_color).toBe('green');
  });

  it('should delete an order', async () => {
    service.delete(9820);

    const pedidos = await firstValueFrom(service.getAll());
    const deleted = pedidos.find(p => p.id_pedido === 9820);
    expect(deleted).toBeUndefined();
    expect(pedidos.length).toBe(5);
  });

  it('should return list of order states and shipment states', () => {
    expect(service.getEstadosPedido().length).toBeGreaterThan(0);
    expect(service.getEstadosEnvio().length).toBeGreaterThan(0);
  });
});
