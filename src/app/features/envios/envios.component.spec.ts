import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EnviosComponent } from './envios.component';
import { ReactiveFormsModule } from '@angular/forms';
import { OrdenService } from '../ordenes/orden.service';
import { EstadoOrdenService } from '../ordenes/estado.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Orden, Estado } from '../../shared/models/models';

describe('EnviosComponent', () => {
  let component: EnviosComponent;
  let fixture: ComponentFixture<EnviosComponent>;

  let ordenServiceSpy: any;
  let estadoOrdenServiceSpy: any;
  let authServiceSpy: any;
  let toastSpy: any;

  let ordenesSubject: BehaviorSubject<Orden[]>;

  beforeEach(async () => {
    ordenesSubject = new BehaviorSubject<Orden[]>([]);

    ordenServiceSpy = {
      ordenes$: ordenesSubject.asObservable(),
      getAll: vi.fn().mockReturnValue(of([])),
      agregarHistorial: vi.fn().mockReturnValue(of({})),
      tomarOrden: vi.fn().mockReturnValue(of({})),
      liberarOrden: vi.fn().mockReturnValue(of({})),
    };

    estadoOrdenServiceSpy = {
      getAll: vi.fn().mockReturnValue(of([])),
    };

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(false),
      getCurrentUser: vi.fn().mockReturnValue({ userId: 'u123', correo: 't@t.com' }),
    };

    toastSpy = {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EnviosComponent, ReactiveFormsModule],
      providers: [
        { provide: OrdenService, useValue: ordenServiceSpy },
        { provide: EstadoOrdenService, useValue: estadoOrdenServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnviosComponent);
    component = fixture.componentInstance;
  });

  it('should create and load data', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(ordenServiceSpy.getAll).toHaveBeenCalled();
  });

  describe('Filtering and Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set active filter', () => {
      component.setFiltro('En tránsito');
      expect(component.filtroActivo).toBe('En tránsito');
    });

    it('should filter relevant shipping orders', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Aprobado' },
        { id: 2, estadoActual: 'En tránsito' },
        { id: 3, estadoActual: 'Pendiente' }, // not relevant for shipping tab
      ];

      expect(component.ordenesFiltradas.length).toBe(2);
      
      component.filtroActivo = 'En tránsito';
      expect(component.ordenesFiltradas.length).toBe(1);
    });

    it('should submit state change modal', () => {
      component.estadosEnvio = [{ id: 'est1', nombre: 'En tránsito' }];
      component.abrirModal({ id: 1, estadoActual: 'Aprobado' });
      component.estadoForm.patchValue({ estadoId: 'est1', comentario: 'ok' });

      component.onSubmit();

      expect(ordenServiceSpy.agregarHistorial).toHaveBeenCalledWith(1, {
        estadoId: 'est1',
        estadoNombre: 'En tránsito',
        comentario: 'ok'
      });
      expect(component.showModal).toBe(false);
    });

    it('should take route (tomarOrden)', () => {
      const o: Orden = { id: 1, estadoActual: 'Aprobado' };
      component.tomarOrden(o);
      expect(ordenServiceSpy.tomarOrden).toHaveBeenCalledWith(1);
    });

    it('should release route (liberarOrden)', () => {
      const o: Orden = { id: 1, estadoActual: 'En tránsito', tomada: true };
      component.liberarOrden(o);
      expect(ordenServiceSpy.liberarOrden).toHaveBeenCalledWith(1);
    });

    it('should handle role and user getters', () => {
      authServiceSpy.hasRole.mockImplementation((...roles: string[]) => roles.includes('transportista'));
      expect(component.esTransportista).toBe(true);
      expect(component.esAdmin).toBe(false);
      expect(component.esBodeguero).toBe(false);
      expect(component.puedeActualizar).toBe(true);

      authServiceSpy.getCurrentUser.mockReturnValue({ userId: 'u999' });
      expect(component.miUserId).toBe('u999');

      authServiceSpy.getCurrentUser.mockReturnValue(null);
      expect(component.miUserId).toBe('');
    });

    it('should handle order state grouping getters', () => {
      component.ordenes = [
        { id: 1, estadoActual: 'Aprobado' },
        { id: 2, estadoActual: 'En tránsito' },
        { id: 3, estadoActual: 'Entregado' },
        { id: 4, estadoActual: 'Cancelado' },
        { id: 5, estadoActual: 'Pendiente' },
      ];
      expect(component.aprobados).toEqual([{ id: 1, estadoActual: 'Aprobado' }]);
      expect(component.enTransito).toEqual([{ id: 2, estadoActual: 'En tránsito' }]);
      expect(component.entregados).toEqual([{ id: 3, estadoActual: 'Entregado' }]);
      expect(component.cancelados).toEqual([{ id: 4, estadoActual: 'Cancelado' }]);
    });

    it('should close state change modal', () => {
      component.showModal = true;
      component.ordenSeleccionada = { id: 1 };
      component.guardando = true;

      component.cerrarModal();

      expect(component.showModal).toBe(false);
      expect(component.ordenSeleccionada).toBeNull();
      expect(component.guardando).toBe(false);
    });

    it('should not submit if form is invalid or no order is selected', () => {
      component.ordenSeleccionada = null;
      component.onSubmit();
      expect(ordenServiceSpy.agregarHistorial).not.toHaveBeenCalled();

      component.ordenSeleccionada = { id: 1 };
      component.estadoForm.setValue({ estadoId: '', comentario: '' }); // invalid
      component.onSubmit();
      expect(ordenServiceSpy.agregarHistorial).not.toHaveBeenCalled();
    });

    it('should handle error when submitting state change', () => {
      ordenServiceSpy.agregarHistorial.mockReturnValue(throwError(() => new Error('API Error')));
      component.ordenSeleccionada = { id: 1 };
      component.estadoForm.setValue({ estadoId: 'est1', comentario: 'fail' });

      component.onSubmit();

      expect(component.guardando).toBe(false);
    });

    it('should handle conflict (409) when taking route', () => {
      ordenServiceSpy.tomarOrden.mockReturnValue(throwError(() => ({ status: 409 })));
      ordenServiceSpy.getAll.mockReturnValue(of([]));

      const o: Orden = { id: 1, estadoActual: 'Aprobado' };
      component.tomarOrden(o);

      expect(toastSpy.warning).toHaveBeenCalledWith('Ruta no disponible', expect.any(String));
      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
    });

    it('should handle other error when taking route', () => {
      ordenServiceSpy.tomarOrden.mockReturnValue(throwError(() => ({ status: 500 })));

      const o: Orden = { id: 1, estadoActual: 'Aprobado' };
      component.tomarOrden(o);

      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
    });

    it('should handle error when releasing route (403 or 409)', () => {
      ordenServiceSpy.liberarOrden.mockReturnValue(throwError(() => ({ status: 403 })));
      ordenServiceSpy.getAll.mockReturnValue(of([]));

      const o: Orden = { id: 1, estadoActual: 'En tránsito' };
      component.liberarOrden(o);

      expect(toastSpy.error).toHaveBeenCalledWith('Error', 'No puedes liberar esta orden.');
      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
    });

    it('should handle error when releasing route (500)', () => {
      ordenServiceSpy.liberarOrden.mockReturnValue(throwError(() => ({ status: 500 })));

      const o: Orden = { id: 1, estadoActual: 'En tránsito' };
      component.liberarOrden(o);

      expect(ordenServiceSpy.getAll).toHaveBeenCalled();
    });

    it('should verify authorization conditions', () => {
      // Setup role and user
      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'transportista');
      authServiceSpy.getCurrentUser.mockReturnValue({ userId: 'u1' });

      const approvedUnowned: Orden = { id: 1, estadoActual: 'Aprobado', tomada: false };
      const approvedOwned: Orden = { id: 2, estadoActual: 'Aprobado', tomada: true, transportistaId: 'u1' };
      const approvedOtherOwned: Orden = { id: 3, estadoActual: 'Aprobado', tomada: true, transportistaId: 'u2' };

      expect(component.puedeTomar(approvedUnowned)).toBe(true);
      expect(component.puedeTomar(approvedOwned)).toBe(false);

      expect(component.puedeLiberar(approvedOwned)).toBe(true);
      expect(component.puedeLiberar(approvedOtherOwned)).toBe(false);

      expect(component.tomadaPorOtro(approvedOtherOwned)).toBe(true);
      expect(component.tomadaPorOtro(approvedOwned)).toBe(false);

      authServiceSpy.hasRole.mockImplementation((...roles: string[]) => roles.includes('admin'));
      const activeOrder: Orden = { id: 4, estadoActual: 'En tránsito' };
      const finalOrder: Orden = { id: 5, estadoActual: 'Entregado' };
      expect(component.puedeActualizarEstado(activeOrder)).toBe(true);
      expect(component.puedeActualizarEstado(finalOrder)).toBe(false);

      authServiceSpy.hasRole.mockImplementation((role: string) => role === 'transportista');
      const activeOwned: Orden = { id: 6, estadoActual: 'En tránsito', tomada: true, transportistaId: 'u1' };
      const activeOtherOwned2: Orden = { id: 7, estadoActual: 'En tránsito', tomada: true, transportistaId: 'u2' };
      expect(component.puedeActualizarComoTransportista(activeOwned)).toBe(true);
      expect(component.puedeActualizarComoTransportista(activeOtherOwned2)).toBe(false);
    });

    it('should return correct badge color and icon classes', () => {
      expect(component.getEstadoBadge('Aprobado')).toBe('bg-indigo-100 text-indigo-800');
      expect(component.getEstadoBadge('En tránsito')).toBe('bg-cyan-100 text-cyan-800');
      expect(component.getEstadoBadge('Entregado')).toBe('bg-green-100 text-green-800');
      expect(component.getEstadoBadge('Cancelado')).toBe('bg-red-100 text-red-800');
      expect(component.getEstadoBadge('Unknown')).toBe('bg-gray-100 text-gray-600');

      expect(component.getEstadoIcono('Aprobado')).toContain('M9 12l2 2');
      expect(component.getEstadoIcono('En tránsito')).toContain('M8 7h12');
      expect(component.getEstadoIcono('Entregado')).toContain('M5 13l4');
      expect(component.getEstadoIcono('Cancelado')).toContain('M6 18L18');
      expect(component.getEstadoIcono('Unknown')).toContain('M12 8v4');
    });

    it('should format date and currency properly', () => {
      expect(component.formatDate()).toBe('—');
      expect(component.formatDate('2026-06-03T10:00:00Z')).toContain('2026');

      expect(component.formatCurrency(5000)).toContain('5.000');
    });
  });
});
