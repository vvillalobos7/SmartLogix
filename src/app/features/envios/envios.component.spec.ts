import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EnviosComponent } from './envios.component';
import { ReactiveFormsModule } from '@angular/forms';
import { OrdenService } from '../ordenes/orden.service';
import { EstadoOrdenService } from '../ordenes/estado.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BehaviorSubject, of } from 'rxjs';
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
  });
});
