import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OrdenesComponent } from './ordenes.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrdenService } from './orden.service';
import { EstadoOrdenService } from './estado.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductoService } from '../productos/producto.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Orden, Estado, Producto } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

describe('OrdenesComponent', () => {
  let component: OrdenesComponent;
  let fixture: ComponentFixture<OrdenesComponent>;
  let httpTestingController: HttpTestingController;

  let ordenServiceSpy: any;
  let estadoOrdenServiceSpy: any;
  let authServiceSpy: any;
  let toastSpy: any;
  let productoServiceSpy: any;

  let ordenesSubject: BehaviorSubject<Orden[]>;
  let productosSubject: BehaviorSubject<Producto[]>;

  beforeEach(async () => {
    ordenesSubject = new BehaviorSubject<Orden[]>([]);
    productosSubject = new BehaviorSubject<Producto[]>([]);

    ordenServiceSpy = {
      ordenes$: ordenesSubject.asObservable(),
      getMisOrdenes: vi.fn().mockReturnValue(of([])),
      getAll: vi.fn().mockReturnValue(of([])),
      agregarHistorial: vi.fn().mockReturnValue(of({})),
      crearOrden: vi.fn().mockReturnValue(of({})),
    };

    estadoOrdenServiceSpy = {
      getAll: vi.fn().mockReturnValue(of([])),
    };

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(false),
      getCurrentUser: vi.fn().mockReturnValue({ userId: '123', correo: 'test@test.com' }),
    };

    toastSpy = {
      success: vi.fn(),
      error: vi.fn(),
    };

    productoServiceSpy = {
      getAll: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [OrdenesComponent, ReactiveFormsModule, FormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrdenService, useValue: ordenServiceSpy },
        { provide: EstadoOrdenService, useValue: estadoOrdenServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ProductoService, useValue: productoServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdenesComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create and fetch initial data', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(estadoOrdenServiceSpy.getAll).toHaveBeenCalled();
    expect(ordenServiceSpy.getAll).toHaveBeenCalled();
  });

  describe('Filtering and getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by state name', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
      ];

      component.filtroEstado = 'Pendiente';
      expect(component.ordenesFiltradas.length).toBe(1);
      expect(component.ordenesFiltradas[0].id).toBe(1);

      expect(component.countByEstado('Procesando')).toBe(1);
    });

    it('should open and close details', () => {
      const o: Orden = { id: 1, estadoActual: 'Pendiente' };
      component.openDetalle(o);
      expect(component.ordenDetalle).toEqual(o);
      expect(component.showDetalle).toBe(true);

      component.closeDetalle();
      expect(component.showDetalle).toBe(false);
      expect(component.ordenDetalle).toBeNull();
    });
  });

  describe('filterByEstado helper method', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all ordenes when estado is empty string', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
        { id: 3, estadoActual: 'Entregado' },
      ];

      const result = component.filterByEstado('');
      expect(result.length).toBe(3);
      expect(result).toEqual(component.ordenes);
    });

    it('should filter ordenes by specific estado', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
        { id: 3, estadoActual: 'Procesando' },
        { id: 4, estadoActual: 'Entregado' },
      ];

      const result = component.filterByEstado('Procesando');
      expect(result.length).toBe(2);
      expect(result.every(o => o.estadoActual === 'Procesando')).toBe(true);
    });

    it('should return empty array when no ordenes match estado', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
      ];

      const result = component.filterByEstado('NoExiste');
      expect(result.length).toBe(0);
    });

    it('should handle null or undefined estado in ordenes', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: undefined },
        { id: 3, estadoActual: 'Pendiente' },
      ];

      const result = component.filterByEstado('Pendiente');
      expect(result.length).toBe(2);
      expect(result.every(o => o.estadoActual === 'Pendiente')).toBe(true);
    });

    it('should handle empty ordenes array', () => {
      component.ordenes = [];
      const result = component.filterByEstado('Pendiente');
      expect(result).toEqual([]);
    });
  });

  describe('ordenesFiltradas getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all ordenes when filtroEstado is not set', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
      ];
      component.filtroEstado = '';

      expect(component.ordenesFiltradas.length).toBe(2);
    });

    it('should return filtered ordenes when filtroEstado is set', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
      ];
      component.filtroEstado = 'Pendiente';

      expect(component.ordenesFiltradas.length).toBe(1);
      expect(component.ordenesFiltradas[0].estadoActual).toBe('Pendiente');
    });

    it('should update ordenesFiltradas when filtroEstado changes', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
        { id: 3, estadoActual: 'Entregado' },
      ];

      component.filtroEstado = 'Pendiente';
      expect(component.ordenesFiltradas.length).toBe(1);

      component.filtroEstado = 'Procesando';
      expect(component.ordenesFiltradas.length).toBe(1);

      component.filtroEstado = 'Entregado';
      expect(component.ordenesFiltradas.length).toBe(1);
    });

    it('should handle multiple ordenes with same estado', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Pendiente' },
        { id: 3, estadoActual: 'Pendiente' },
      ];
      component.filtroEstado = 'Pendiente';

      expect(component.ordenesFiltradas.length).toBe(3);
    });
  });

  describe('countByEstado method', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should count ordenes with specific estado', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
        { id: 3, estadoActual: 'Procesando' },
      ];

      expect(component.countByEstado('Pendiente')).toBe(1);
      expect(component.countByEstado('Procesando')).toBe(2);
    });

    it('should return 0 when no ordenes match estado', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
      ];

      expect(component.countByEstado('Entregado')).toBe(0);
    });

    it('should return 0 when ordenes array is empty', () => {
      component.ordenes = [];
      expect(component.countByEstado('Pendiente')).toBe(0);
    });

    it('should count all estados independently', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Pendiente' },
        { id: 3, estadoActual: 'Procesando' },
        { id: 4, estadoActual: 'Procesando' },
        { id: 5, estadoActual: 'Procesando' },
        { id: 6, estadoActual: 'Entregado' },
      ];

      expect(component.countByEstado('Pendiente')).toBe(2);
      expect(component.countByEstado('Procesando')).toBe(3);
      expect(component.countByEstado('Entregado')).toBe(1);
      expect(component.countByEstado('Cancelado')).toBe(0);
    });

    it('should handle null or undefined estado in ordenes', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: undefined },
        { id: 3, estadoActual: 'Pendiente' },
      ];

      expect(component.countByEstado('Pendiente')).toBe(2);
      expect(component.countByEstado(undefined as any)).toBe(0);
    });
  });

  describe('Form initialization', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize historialForm with required fields', () => {
      component.initHistorialForm();
      expect(component.historialForm).toBeDefined();
      expect(component.historialForm.get('estadoId')).toBeDefined();
      expect(component.historialForm.get('comentario')).toBeDefined();
    });

    it('should have estadoId as required field', () => {
      component.initHistorialForm();
      const estadoIdControl = component.historialForm.get('estadoId');
      expect(estadoIdControl?.hasError('required')).toBe(true);

      estadoIdControl?.setValue('some-id');
      expect(estadoIdControl?.hasError('required')).toBe(false);
    });

    it('should have comentario as optional field', () => {
      component.initHistorialForm();
      const comentarioControl = component.historialForm.get('comentario');
      expect(comentarioControl?.valid).toBe(true);

      comentarioControl?.setValue('');
      expect(comentarioControl?.valid).toBe(true);
    });

    it('should mark form as invalid when required fields are empty', () => {
      component.initHistorialForm();
      expect(component.historialForm.valid).toBe(false);

      component.historialForm.patchValue({ estadoId: 'some-id' });
      expect(component.historialForm.valid).toBe(true);
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle component with no ordenes', () => {
      component.ordenes = [];
      expect(component.ordenesFiltradas).toEqual([]);
      expect(component.countByEstado('Pendiente')).toBe(0);
    });

    it('should handle estado filter with empty string and null ordenes', () => {
      component.ordenes = [];
      component.filtroEstado = '';
      expect(component.ordenesFiltradas).toEqual([]);
    });

    it('should handle rapid estado filter changes', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
        { id: 3, estadoActual: 'Entregado' },
      ];

      component.filtroEstado = 'Pendiente';
      expect(component.ordenesFiltradas.length).toBe(1);

      component.filtroEstado = 'Procesando';
      expect(component.ordenesFiltradas.length).toBe(1);

      component.filtroEstado = 'Entregado';
      expect(component.ordenesFiltradas.length).toBe(1);

      component.filtroEstado = '';
      expect(component.ordenesFiltradas.length).toBe(3);
    });

    it('should not modify original ordenes array when filtering', () => {
      const originalOrdenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'Procesando' },
      ];
      component.ordenes = [...originalOrdenes];

      component.filterByEstado('Pendiente');

      expect(component.ordenes).toEqual(originalOrdenes);
      expect(component.ordenes.length).toBe(2);
    });

    it('should handle estado names with different cases (case-sensitive)', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Pendiente' },
        { id: 2, estadoActual: 'pendiente' },
      ];

      const result = component.filterByEstado('Pendiente');
      expect(result.length).toBe(1);

      const resultLower = component.filterByEstado('pendiente');
      expect(resultLower.length).toBe(1);
    });
  });

  describe('New Order Flow', () => {
    beforeEach(() => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'cliente');
      fixture.detectChanges();
    });

    it('should load products and user details on openNewPedido', () => {
      const mockProducts: Producto[] = [
        { id: 'p1', nombre: 'P1', precio: 10, stock: 5, activo: true },
      ];
      productoServiceSpy.getAll.mockReturnValue(of(mockProducts));

      component.abrirNuevoPedido();

      const reqUser = httpTestingController.expectOne(`${environment.services.usuarios}/me`);
      reqUser.flush({ id: '123', direccion: { id: 'dir123' } });

      expect(component.showNuevoPedido).toBe(true);
      expect(component.direccionId).toBe('dir123');
      expect(component.productosDisponibles).toEqual(mockProducts);
    });

    it('should manage cart items', () => {
      const p: Producto = { id: 'p1', nombre: 'P1', precio: 10, stock: 5, activo: true };
      
      component.agregarAlCarrito(p);
      expect(component.totalItems()).toBe(1);
      expect(component.getCantidad('p1')).toBe(1);

      component.agregarAlCarrito(p);
      expect(component.getCantidad('p1')).toBe(2);

      component.quitarDelCarrito(p);
      expect(component.getCantidad('p1')).toBe(1);

      expect(component.totalCarrito()).toBe(10);
    });

    it('should place order successfully', () => {
      const p: Producto = { id: 'p1', nombre: 'P1', precio: 10, stock: 5, activo: true };
      component.carrito = [{ producto: p, cantidad: 2 }];
      component.direccionId = 'dir123';

      component.confirmarPedido();

      expect(ordenServiceSpy.crearOrden).toHaveBeenCalled();
    });

    it('should not place order if cart is empty or processing', () => {
      component.carrito = [];
      component.direccionId = 'dir123';
      component.confirmarPedido();
      expect(ordenServiceSpy.crearOrden).not.toHaveBeenCalled();

      component.carrito = [{ producto: { id: 'p1', precio: 10 } as any, cantidad: 1 }];
      component.procesandoOrden = true;
      component.confirmarPedido();
      expect(ordenServiceSpy.crearOrden).not.toHaveBeenCalled();
    });

    it('should show toast error if confirming order with no address', () => {
      component.carrito = [{ producto: { id: 'p1', precio: 10 } as any, cantidad: 1 }];
      component.direccionId = null;
      component.procesandoOrden = false;

      component.confirmarPedido();

      expect(toastSpy.error).toHaveBeenCalledWith('Sin dirección registrada', expect.any(String));
      expect(ordenServiceSpy.crearOrden).not.toHaveBeenCalled();
    });

    it('should not place order if user is null', () => {
      component.carrito = [{ producto: { id: 'p1', precio: 10 } as any, cantidad: 1 }];
      component.direccionId = 'dir123';
      authServiceSpy.getCurrentUser.mockReturnValue(null);

      component.confirmarPedido();

      expect(component.procesandoOrden).toBe(false);
      expect(ordenServiceSpy.crearOrden).not.toHaveBeenCalled();
    });

    it('should handle HTTP error when placing order', () => {
      ordenServiceSpy.crearOrden.mockReturnValue(throwError(() => new Error('API Error')));
      component.carrito = [{ producto: { id: 'p1', precio: 10 } as any, cantidad: 1 }];
      component.direccionId = 'dir123';

      component.confirmarPedido();

      expect(component.procesandoOrden).toBe(false);
    });

    it('should close new order modal', () => {
      component.showNuevoPedido = true;
      component.carrito = [{ producto: {} as any, cantidad: 1 }];
      component.paisModal = 'Chile';

      component.cerrarNuevoPedido();

      expect(component.showNuevoPedido).toBe(false);
      expect(component.carrito).toEqual([]);
      expect(component.paisModal).toBe('');
    });

    it('should get unique sorted list of available countries in modal', () => {
      component.productosDisponibles = [
        { id: '1', nombre: 'P1', pais: 'Colombia', activo: true } as any,
        { id: '2', nombre: 'P2', pais: 'Argentina', activo: true } as any,
        { id: '3', nombre: 'P3', pais: null, activo: true } as any,
      ];
      expect(component.paisesDisponibles).toEqual(['Argentina', 'Chile', 'Colombia']);
    });

    it('should filter modal products by country', () => {
      component.productosDisponibles = [
        { id: '1', nombre: 'P1', pais: 'Chile' } as any,
        { id: '2', nombre: 'P2', pais: 'Colombia' } as any,
      ];
      component.paisModal = 'Colombia';
      expect(component.productosModalFiltrados.length).toBe(1);
      expect(component.productosModalFiltrados[0].id).toBe('2');

      component.paisModal = '';
      expect(component.productosModalFiltrados.length).toBe(2);
    });

    it('should manage cart edge cases', () => {
      const p1: Producto = { id: 'p1', nombre: 'P1', precio: 10, stock: 2, activo: true };
      const p2: Producto = { id: 'p2', nombre: 'P2', precio: 20, stock: 10, activo: true };

      component.carrito = [];
      component.agregarAlCarrito(p1);
      component.agregarAlCarrito(p1);
      component.agregarAlCarrito(p1); // should not exceed stock of 2
      expect(component.getCantidad('p1')).toBe(2);

      component.quitarDelCarrito(p2); // removing non-existing item
      expect(component.carrito.length).toBe(1);

      component.quitarDelCarrito(p1); // qty 2 -> 1
      expect(component.getCantidad('p1')).toBe(1);

      component.quitarDelCarrito(p1); // qty 1 -> 0, item removed
      expect(component.getCantidad('p1')).toBe(0);
      expect(component.carrito.length).toBe(0);
    });
  });

  describe('Historial and Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open and close historial modal', () => {
      const o: Orden = { id: 1 };
      component.openHistorial(o);
      expect(component.ordenDetalle).toEqual(o);
      expect(component.showHistorialModal).toBe(true);

      component.closeHistorial();
      expect(component.showHistorialModal).toBe(false);
    });

    it('should submit new history entry', () => {
      const o: Orden = { id: 1 };
      component.estadosDisponibles = [{ id: 'est1', nombre: 'Procesando' }];
      component.openHistorial(o);
      component.historialForm.patchValue({ estadoId: 'est1', comentario: 'Processing order' });

      component.onSubmitHistorial();

      expect(ordenServiceSpy.agregarHistorial).toHaveBeenCalledWith(1, {
        estadoId: 'est1',
        estadoNombre: 'Procesando',
        comentario: 'Processing order'
      });
      expect(component.showHistorialModal).toBe(false);
    });

    it('should fallback to ID if state name not found on history submit', () => {
      const o: Orden = { id: 1 };
      component.estadosDisponibles = [];
      component.openHistorial(o);
      component.historialForm.patchValue({ estadoId: 'unknown-id', comentario: '' });

      component.onSubmitHistorial();

      expect(ordenServiceSpy.agregarHistorial).toHaveBeenCalledWith(1, {
        estadoId: 'unknown-id',
        estadoNombre: 'unknown-id',
        comentario: ''
      });
    });

    it('should not submit history if form is invalid or no order selected', () => {
      component.ordenDetalle = null;
      component.onSubmitHistorial();
      expect(ordenServiceSpy.agregarHistorial).not.toHaveBeenCalled();
    });

    it('should cancel order if confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.estadosDisponibles = [{ id: 'est6', nombre: 'Cancelado' }];
      const o: Orden = { id: 123 };

      component.cancelarOrden(o);

      expect(ordenServiceSpy.agregarHistorial).toHaveBeenCalledWith(123, {
        estadoId: 'est6',
        estadoNombre: 'Cancelado',
        comentario: 'Cancelado por el cliente'
      });
      expect(toastSpy.success).toHaveBeenCalledWith('Orden cancelada', expect.any(String));
      expect(ordenServiceSpy.getMisOrdenes).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should handle HTTP error when cancelling order', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      ordenServiceSpy.agregarHistorial.mockReturnValue(throwError(() => new Error('Error')));
      const o: Orden = { id: 123 };

      component.cancelarOrden(o);

      expect(ordenServiceSpy.getMisOrdenes).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should not cancel order if confirm is rejected', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const o: Orden = { id: 123 };
      component.cancelarOrden(o);
      expect(ordenServiceSpy.agregarHistorial).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should confirm delivery if confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.estadosDisponibles = [{ id: 'est5', nombre: 'Entregado' }];
      const o: Orden = { id: 456 };

      component.confirmarEntrega(o);

      expect(ordenServiceSpy.agregarHistorial).toHaveBeenCalledWith(456, {
        estadoId: 'est5',
        estadoNombre: 'Entregado',
        comentario: 'Entrega confirmada por el cliente'
      });
      expect(toastSpy.success).toHaveBeenCalledWith('¡Recibo confirmado!', expect.any(String));
      expect(ordenServiceSpy.getMisOrdenes).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should handle HTTP error when confirming delivery', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      ordenServiceSpy.agregarHistorial.mockReturnValue(throwError(() => new Error('Error')));
      const o: Orden = { id: 456 };

      component.confirmarEntrega(o);

      expect(ordenServiceSpy.getMisOrdenes).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should not confirm delivery if confirm is rejected', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const o: Orden = { id: 456 };
      component.confirmarEntrega(o);
      expect(ordenServiceSpy.agregarHistorial).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should check canCancel conditions', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'cliente');

      const p: Orden = { id: 1, estadoActual: 'Pendiente' };
      const pr: Orden = { id: 2, estadoActual: 'Procesando' };
      const del: Orden = { id: 3, estadoActual: 'Entregado' };

      expect(component.puedeCanCelar(p)).toBe(true);
      expect(component.puedeCanCelar(pr)).toBe(true);
      expect(component.puedeCanCelar(del)).toBe(false);

      authServiceSpy.hasRole.mockReturnValue(false);
      expect(component.puedeCanCelar(p)).toBe(false);
    });

    it('should check puedeConfirmar conditions', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'cliente');

      const delNotConfirmed: Orden = { id: 1, estadoActual: 'Entregado', historial: [] };
      const delConfirmed: Orden = { id: 2, estadoActual: 'Entregado', historial: [{ comentario: 'Entrega confirmada por el cliente' }] };
      const pr: Orden = { id: 3, estadoActual: 'Procesando' };

      expect(component.puedeConfirmar(delNotConfirmed)).toBe(true);
      expect(component.puedeConfirmar(delConfirmed)).toBe(false);
      expect(component.puedeConfirmar(pr)).toBe(false);

      authServiceSpy.hasRole.mockReturnValue(false);
      expect(component.puedeConfirmar(delNotConfirmed)).toBe(false);
    });

    it('should fetch all orders if user is not a client', () => {
      authServiceSpy.hasRole.mockImplementation((role: string) => role !== 'cliente');
      component.ngOnInit();
      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
    });

    it('should use local helpers and getters', () => {
      component.estadosDisponibles = [{ id: '1', nombre: 'Aprobado' }];
      expect(component.estadoNombres).toEqual(['Aprobado']);
      expect(component.getEstadoBadge('Pendiente')).toContain('yellow');
      expect(component.formatCurrency(100)).toContain('100');
      expect(component.formatDate('2026-06-03T10:00:00Z')).toContain('2026');
      expect(component.getHistorial({ id: 1, historial: [{ id: 'h1' }] as any })).toEqual([{ id: 'h1' }]);
      expect(component.esBodeguero).toBe(false);
    });
  });
});
