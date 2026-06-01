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
import { BehaviorSubject, of } from 'rxjs';
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
  });
});
