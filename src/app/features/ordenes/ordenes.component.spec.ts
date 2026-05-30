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
