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
});
