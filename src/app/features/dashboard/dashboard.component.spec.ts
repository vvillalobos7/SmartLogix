import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { OrdenService } from '../ordenes/orden.service';
import { InventarioService } from '../inventario/inventario.service';
import { ProductoService } from '../productos/producto.service';
import { UsuarioService } from '../usuarios/usuario.service';
import { BehaviorSubject, of } from 'rxjs';
import { Orden, Bodega, Producto, Usuario } from '../../shared/models/models';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  
  let authServiceSpy: any;
  let ordenServiceSpy: any;
  let inventarioServiceSpy: any;
  let productoServiceSpy: any;
  let usuarioServiceSpy: any;

  let ordenesSubject: BehaviorSubject<Orden[]>;
  let bodegasSubject: BehaviorSubject<Bodega[]>;
  let productosSubject: BehaviorSubject<Producto[]>;
  let usuariosSubject: BehaviorSubject<Usuario[]>;

  beforeEach(async () => {
    ordenesSubject = new BehaviorSubject<Orden[]>([]);
    bodegasSubject = new BehaviorSubject<Bodega[]>([]);
    productosSubject = new BehaviorSubject<Producto[]>([]);
    usuariosSubject = new BehaviorSubject<Usuario[]>([]);

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(false),
    };

    ordenServiceSpy = {
      ordenes$: ordenesSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
      getMisOrdenes: vi.fn().mockReturnValue(of([])),
    };

    inventarioServiceSpy = {
      bodegas$: bodegasSubject.asObservable(),
      getBodegas: vi.fn().mockReturnValue(of([])),
    };

    productoServiceSpy = {
      productos$: productosSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
    };

    usuarioServiceSpy = {
      usuarios$: usuariosSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: OrdenService, useValue: ordenServiceSpy },
        { provide: InventarioService, useValue: inventarioServiceSpy },
        { provide: ProductoService, useValue: productoServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Role-based initialization', () => {
    it('should initialize for cliente role', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'cliente');
      fixture.detectChanges();

      expect(ordenServiceSpy.getMisOrdenes).toHaveBeenCalled();
      expect(ordenServiceSpy.getAll).not.toHaveBeenCalled();
      expect(inventarioServiceSpy.getBodegas).not.toHaveBeenCalled();
    });

    it('should initialize for transportista role', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'transportista');
      fixture.detectChanges();

      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
      expect(ordenServiceSpy.getMisOrdenes).not.toHaveBeenCalled();
      expect(inventarioServiceSpy.getBodegas).not.toHaveBeenCalled();
    });

    it('should initialize for other roles (admin/bodeguero)', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'admin');
      fixture.detectChanges();

      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
      expect(inventarioServiceSpy.getBodegas).toHaveBeenCalled();
      expect(productoServiceSpy.getAll).toHaveBeenCalled();
      expect(usuarioServiceSpy.getAll).toHaveBeenCalled();
    });
  });

  describe('Getters and helper methods', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockReturnValue(false); // default
      fixture.detectChanges();
    });

    it('should calculate pending, in-transit, and delivered orders correctly', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 1000 },
        { id: 2, estadoActual: 'En tránsito', total: 2000 },
        { id: 3, estadoActual: 'Entregado', total: 3000 },
        { id: 4, estadoActual: 'Pendiente', total: 1500 },
      ];
      ordenesSubject.next(mockOrders);

      expect(component.ordenesPendientes.length).toBe(2);
      expect(component.ordenesEnTransito.length).toBe(1);
      expect(component.ordenesEntregadas.length).toBe(1);
      expect(component.getTotalOrdenes()).toBe(7500);
    });

    it('should return correct badge classes for states', () => {
      expect(component.getEstadoBadge('Pendiente')).toBe('bg-yellow-100 text-yellow-800');
      expect(component.getEstadoBadge('Procesando')).toBe('bg-blue-100 text-blue-800');
      expect(component.getEstadoBadge('Entregado')).toBe('bg-green-100 text-green-800');
      expect(component.getEstadoBadge('Unknown')).toBe('bg-gray-100 text-gray-600');
    });

    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(5000);
      expect(formatted).toContain('$');
    });

    it('should format dates correctly', () => {
      expect(component.formatDate()).toBe('—');
      const isoDate = '2025-04-19T08:15:00';
      const formattedDate = component.formatDate(isoDate);
      expect(formattedDate).not.toBe('—');
    });
  });

  describe('filterByEstado helper method', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockReturnValue(false);
      fixture.detectChanges();
    });

    it('should filter orders by estado correctly', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 1000 },
        { id: 2, estadoActual: 'En tránsito', total: 2000 },
        { id: 3, estadoActual: 'Pendiente', total: 1500 },
        { id: 4, estadoActual: 'Entregado', total: 3000 },
      ];
      ordenesSubject.next(mockOrders);

      expect(component['filterByEstado']('Pendiente').length).toBe(2);
      expect(component['filterByEstado']('En tránsito').length).toBe(1);
      expect(component['filterByEstado']('Entregado').length).toBe(1);
      expect(component['filterByEstado']('Cancelado').length).toBe(0);
    });

    it('should return empty array when no orders match estado', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 1000 },
      ];
      ordenesSubject.next(mockOrders);

      expect(component['filterByEstado']('Cancelado')).toEqual([]);
    });

    it('should return all filtered orders, not mutate original array', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 1000 },
        { id: 2, estadoActual: 'Pendiente', total: 2000 },
      ];
      ordenesSubject.next(mockOrders);

      const filtered = component['filterByEstado']('Pendiente');
      expect(filtered.length).toBe(2);
      expect(component.ordenes.length).toBe(2);
    });
  });

  describe('Empty ordenes array', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockReturnValue(false);
      fixture.detectChanges();
    });

    it('should return empty array when ordenes is empty', () => {
      ordenesSubject.next([]);

      expect(component.ordenesPendientes).toEqual([]);
      expect(component.ordenesEnTransito).toEqual([]);
      expect(component.ordenesEntregadas).toEqual([]);
      expect(component.enviosAprobados).toEqual([]);
      expect(component.enviosCancelados).toEqual([]);
    });

    it('should handle filtroEstado with empty array gracefully', () => {
      ordenesSubject.next([]);

      expect(component['filterByEstado']('Pendiente')).toEqual([]);
      expect(component['filterByEstado']('Cancelado')).toEqual([]);
    });
  });

  describe('Null and undefined estadoActual values', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockReturnValue(false);
      fixture.detectChanges();
    });

    it('should handle null estadoActual values correctly', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 1000 },
        { id: 2, estadoActual: null as any, total: 2000 },
        { id: 3, estadoActual: 'Pendiente', total: 1500 },
      ];
      ordenesSubject.next(mockOrders);

      expect(component.ordenesPendientes.length).toBe(2);
      expect(component['filterByEstado']('Pendiente')).toEqual(mockOrders.slice(0, 1).concat(mockOrders.slice(2)));
    });

    it('should handle undefined estadoActual values correctly', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 1000 },
        { id: 2, estadoActual: undefined, total: 2000 },
        { id: 3, estadoActual: 'Entregado', total: 1500 },
      ];
      ordenesSubject.next(mockOrders);

      expect(component.ordenesPendientes.length).toBe(1);
      expect(component.ordenesEntregadas.length).toBe(1);
      expect(component['filterByEstado']('Pendiente')[0].id).toBe(1);
    });

    it('should not match orders with null/undefined when filtering by specific estado', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: undefined },
        { id: 3, estadoActual: null as any },
      ];
      ordenesSubject.next(mockOrders);

      const pendientes = component['filterByEstado']('Pendiente');
      expect(pendientes.length).toBe(1);
      expect(pendientes[0].id).toBe(1);
    });
  });

  describe('Role-based getters', () => {
    it('esCliente should return true when client role is set', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'cliente');
      fixture.detectChanges();

      expect(component.esCliente).toBe(true);
      expect(component.esTransportista).toBe(false);
      expect(component.esAdmin).toBe(false);
    });

    it('esTransportista should return true when transportista role is set', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'transportista');
      fixture.detectChanges();

      expect(component.esCliente).toBe(false);
      expect(component.esTransportista).toBe(true);
      expect(component.esAdmin).toBe(false);
    });

    it('esAdmin should return true when admin role is set', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'admin');
      fixture.detectChanges();

      expect(component.esCliente).toBe(false);
      expect(component.esTransportista).toBe(false);
      expect(component.esAdmin).toBe(true);
    });

    it('should have all role getters return false by default', () => {
      authServiceSpy.hasRole.mockReturnValue(false);
      fixture.detectChanges();

      expect(component.esCliente).toBe(false);
      expect(component.esTransportista).toBe(false);
      expect(component.esAdmin).toBe(false);
    });
  });

  describe('All estado filters using filterByEstado', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockReturnValue(false);
      fixture.detectChanges();
    });

    it('should correctly filter all order status types', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente', total: 100 },
        { id: 2, estadoActual: 'En tránsito', total: 200 },
        { id: 3, estadoActual: 'Entregado', total: 300 },
        { id: 4, estadoActual: 'Aprobado', total: 400 },
        { id: 5, estadoActual: 'Cancelado', total: 500 },
        { id: 6, estadoActual: 'Procesando', total: 600 },
      ];
      ordenesSubject.next(mockOrders);

      expect(component.ordenesPendientes.length).toBe(1);
      expect(component.ordenesEnTransito.length).toBe(1);
      expect(component.ordenesEntregadas.length).toBe(1);
      expect(component.enviosAprobados.length).toBe(1);
      expect(component.enviosCancelados.length).toBe(1);
      expect(component['filterByEstado']('Procesando').length).toBe(1);
    });

    it('resumenEstados should use filterByEstado for all status counts', () => {
      const mockOrders: Orden[] = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
        { id: 3, estadoActual: 'Aprobado' },
        { id: 4, estadoActual: 'Pendiente' },
      ];
      ordenesSubject.next(mockOrders);

      const resumen = component.resumenEstados;
      const pendienteResumen = resumen.find(r => r.estado === 'Pendiente');
      const procesandoResumen = resumen.find(r => r.estado === 'Procesando');

      expect(pendienteResumen?.cantidad).toBe(2);
      expect(procesandoResumen?.cantidad).toBe(1);
    });
  });
});
