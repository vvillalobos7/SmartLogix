import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Pedido, LineaPedido, EstadoPedido, EstadoEnvio } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class OrdenService {

  estadosPedido: EstadoPedido[] = [
    { id_estado: 1, nombre: 'Pendiente',    descripcion: 'Pedido recibido, en espera de procesamiento.', color: 'yellow', orden: 1 },
    { id_estado: 2, nombre: 'Procesando',   descripcion: 'Pedido en preparación en bodega.',              color: 'blue',   orden: 2 },
    { id_estado: 3, nombre: 'Aprobado',     descripcion: 'Pedido aprobado y listo para despacho.',        color: 'green',  orden: 3 },
    { id_estado: 4, nombre: 'En tránsito',  descripcion: 'Pedido en camino al destino final.',            color: 'blue',   orden: 4 },
    { id_estado: 5, nombre: 'Entregado',    descripcion: 'Pedido entregado satisfactoriamente.',          color: 'green',  orden: 5 },
    { id_estado: 6, nombre: 'Cancelado',    descripcion: 'Pedido cancelado por el cliente o sistema.',    color: 'red',    orden: 6 },
  ];

  estadosEnvio: EstadoEnvio[] = [
    { id_estado_envio: 1, nombre: 'Preparando',  descripcion: 'Paquete en preparación.',                   color: 'yellow', orden: 1 },
    { id_estado_envio: 2, nombre: 'Despachado',  descripcion: 'Paquete entregado al transportista.',        color: 'blue',   orden: 2 },
    { id_estado_envio: 3, nombre: 'En ruta',     descripcion: 'Paquete en camino al destino.',              color: 'blue',   orden: 3 },
    { id_estado_envio: 4, nombre: 'Entregado',   descripcion: 'Paquete recibido por el destinatario.',      color: 'green',  orden: 4 },
    { id_estado_envio: 5, nombre: 'Fallido',     descripcion: 'Intento de entrega fallido.',                color: 'red',    orden: 5 },
  ];

  private mockLineas: LineaPedido[] = [
    { id_linea: 1, id_pedido: 9820, id_producto: 1, producto: 'Smartphone Samsung Galaxy A54', sku: 'SKU-1001', cantidad: 2, precio_unitario: 1250000 },
    { id_linea: 2, id_pedido: 9820, id_producto: 2, producto: 'Audífonos Sony WH-1000XM5',     sku: 'SKU-1002', cantidad: 1, precio_unitario: 980000  },
    { id_linea: 3, id_pedido: 9821, id_producto: 3, producto: 'Silla Ergonómica Premium',       sku: 'SKU-2001', cantidad: 1, precio_unitario: 850000  },
    { id_linea: 4, id_pedido: 9822, id_producto: 4, producto: 'Monitor LG UltraWide 34"',       sku: 'SKU-2002', cantidad: 1, precio_unitario: 2100000 },
    { id_linea: 5, id_pedido: 9823, id_producto: 6, producto: 'Termo Stanley Adventure 1L',     sku: 'SKU-4001', cantidad: 3, precio_unitario: 185000  },
    { id_linea: 6, id_pedido: 9824, id_producto: 5, producto: 'Caja de embalaje reforzada L',   sku: 'SKU-3001', cantidad: 100,precio_unitario: 8500   },
  ];

  private mockPedidos: Pedido[] = [
    {
      id_pedido: 9820, fecha_pedido: '2025-04-19T08:15:00', id_estado: 5, estado: 'Entregado',   estado_color: 'green',
      total: 3480000, id_cliente: 101, cliente: 'María Torres',    email_cliente: 'maria.t@gmail.com',
      id_estado_envio: 4, estado_envio: 'Entregado',
    },
    {
      id_pedido: 9821, fecha_pedido: '2025-04-19T09:30:00', id_estado: 4, estado: 'En tránsito', estado_color: 'blue',
      total: 850000,  id_cliente: 102, cliente: 'Carlos Mejía',    email_cliente: 'cmejia@empresa.co',
      id_estado_envio: 3, estado_envio: 'En ruta',
    },
    {
      id_pedido: 9822, fecha_pedido: '2025-04-19T10:00:00', id_estado: 2, estado: 'Procesando',  estado_color: 'blue',
      total: 2100000, id_cliente: 103, cliente: 'Sofía Ramírez',   email_cliente: 'sofia_r@hotmail.com',
      id_estado_envio: 1, estado_envio: 'Preparando',
    },
    {
      id_pedido: 9823, fecha_pedido: '2025-04-18T14:00:00', id_estado: 5, estado: 'Entregado',   estado_color: 'green',
      total: 555000,  id_cliente: 104, cliente: 'Andrés Castillo', email_cliente: 'acastillo@co.com',
      id_estado_envio: 4, estado_envio: 'Entregado',
    },
    {
      id_pedido: 9824, fecha_pedido: '2025-04-18T16:30:00', id_estado: 1, estado: 'Pendiente',   estado_color: 'yellow',
      total: 850000,  id_cliente: 105, cliente: 'Laura Vega',      email_cliente: 'lvega@distribuidora.co',
      id_estado_envio: 1, estado_envio: 'Preparando',
    },
    {
      id_pedido: 9819, fecha_pedido: '2025-04-17T11:00:00', id_estado: 6, estado: 'Cancelado',   estado_color: 'red',
      total: 1250000, id_cliente: 106, cliente: 'Pedro Jiménez',   email_cliente: 'p.jimenez@gmail.com',
      id_estado_envio: 5, estado_envio: 'Fallido',
    },
  ];

  private pedidosSubject = new BehaviorSubject<Pedido[]>(this.mockPedidos);
  pedidos$ = this.pedidosSubject.asObservable();

  getAll(): Observable<Pedido[]> { return this.pedidos$; }

  getById(id: number): Pedido | undefined {
    return this.pedidosSubject.value.find(p => p.id_pedido === id);
  }

  getLineasByPedido(id_pedido: number): LineaPedido[] {
    return this.mockLineas.filter(l => l.id_pedido === id_pedido).map(l => ({
      ...l, subtotal: l.cantidad * l.precio_unitario,
    }));
  }

  create(pedido: Omit<Pedido, 'id_pedido'>): void {
    const current = this.pedidosSubject.value;
    const newId = Math.max(...current.map(p => p.id_pedido), 0) + 1;
    const estado = this.estadosPedido.find(e => e.id_estado === pedido.id_estado);
    this.pedidosSubject.next([
      { ...pedido, id_pedido: newId, estado: estado?.nombre, estado_color: estado?.color },
      ...current,
    ]);
  }

  update(id: number, changes: Partial<Pedido>): void {
    const current = this.pedidosSubject.value;
    const estado = changes.id_estado
      ? this.estadosPedido.find(e => e.id_estado === changes.id_estado)
      : undefined;
    this.pedidosSubject.next(current.map(p =>
      p.id_pedido === id
        ? { ...p, ...changes, estado: estado?.nombre ?? p.estado, estado_color: estado?.color ?? p.estado_color }
        : p
    ));
  }

  delete(id: number): void {
    this.pedidosSubject.next(this.pedidosSubject.value.filter(p => p.id_pedido !== id));
  }

  getEstadosPedido(): EstadoPedido[] { return this.estadosPedido; }
  getEstadosEnvio(): EstadoEnvio[] { return this.estadosEnvio; }
}
