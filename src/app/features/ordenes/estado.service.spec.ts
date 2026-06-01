import { TestBed } from '@angular/core/testing';
import { EstadoOrdenService } from './estado.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Estado } from '../../shared/models/models';
import { firstValueFrom } from 'rxjs';

describe('EstadoOrdenService (Feature)', () => {
  let service: EstadoOrdenService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EstadoOrdenService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EstadoOrdenService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.getSnapshot().length).toBe(6);
  });

  it('should get all states and filter by type or name', async () => {
    const mockStates: Estado[] = [
      { id: '1', nombre: 'Pendiente', tipoDeEstado: { id: 't1', nombre: 'orden' } },
      { id: '2', nombre: 'random-state', tipoDeEstado: { id: 't2', nombre: 'user' } },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    expect(req.request.method).toBe('GET');
    req.flush(mockStates);

    const states = await promise;
    // expect only states whose tipoDeEstado.nombre === 'orden' or in ORDEN_NOMBRES
    expect(states.length).toBe(1);
    expect(states[0].nombre).toBe('Pendiente');
  });

  it('should fall back to mock data if API returns no matching states', async () => {
    const mockStates: Estado[] = [
      { id: '2', nombre: 'random-state', tipoDeEstado: { id: 't2', nombre: 'user' } },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush(mockStates);

    const states = await promise;
    expect(states.length).toBe(6); // mockEstados length
  });

  it('should fall back to mock data if API fails', async () => {
    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    const states = await promise;
    expect(states.length).toBe(6); // mockEstados length
  });

  it('should update subject when new states are fetched', () => {
    const mockStates: Estado[] = [
      { id: '1', nombre: 'Procesando', tipoDeEstado: { id: 't1', nombre: 'orden' } },
    ];

    let emitted = false;
    service.getAll().subscribe(() => {
      expect(service.getSnapshot()).toEqual([mockStates[0]]);
      emitted = true;
    });

    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush(mockStates);

    expect(emitted).toBe(true);
  });

  it('should handle network error (0 status)', async () => {
    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    req.error(new ProgressEvent('Network error'));

    const states = await promise;
    expect(states.length).toBe(6);
    expect(states[0].nombre).toBe('Pendiente');
  });

  it('should handle 404 Not Found error', async () => {
    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    const states = await promise;
    expect(states).toEqual(service.getSnapshot());
  });

  it('should filter states matching ORDEN_NOMBRES', async () => {
    const mockStates: Estado[] = [
      { id: '1', nombre: 'Pendiente', tipoDeEstado: { id: 't1', nombre: 'other' } },
      { id: '2', nombre: 'Procesando', tipoDeEstado: { id: 't2', nombre: 'other' } },
      { id: '3', nombre: 'Entregado', tipoDeEstado: { id: 't3', nombre: 'other' } },
      { id: '4', nombre: 'UnknownState', tipoDeEstado: { id: 't4', nombre: 'other' } },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush(mockStates);

    const states = await promise;
    expect(states.length).toBe(3);
    expect(states.map(s => s.nombre)).toContain('Pendiente');
    expect(states.map(s => s.nombre)).toContain('Procesando');
    expect(states.map(s => s.nombre)).toContain('Entregado');
    expect(states.map(s => s.nombre)).not.toContain('UnknownState');
  });

  it('should return initial mock data from getSnapshot before any API call', () => {
    const snapshot = service.getSnapshot();
    expect(snapshot.length).toBe(6);
    expect(snapshot[0].nombre).toBe('Pendiente');
    expect(snapshot[snapshot.length - 1].nombre).toBe('Cancelado');
  });

  it('should handle null tipoDeEstado gracefully', async () => {
    const mockStates: Estado[] = [
      { id: '1', nombre: 'Cancelado', tipoDeEstado: null as any },
      { id: '2', nombre: 'InvalidState', tipoDeEstado: undefined },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush(mockStates);

    const states = await promise;
    expect(states.length).toBe(1);
    expect(states[0].nombre).toBe('Cancelado');
  });

  it('should emit result to estados$ observable', () => {
    const mockStates: Estado[] = [
      { id: '3', nombre: 'Aprobado', tipoDeEstado: { id: 't1', nombre: 'orden' } },
    ];

    let emitted = false;
    const subscription = service.estados$.subscribe((states) => {
      if (states.length > 0 && states[0].nombre === 'Aprobado') {
        expect(states).toEqual(mockStates);
        emitted = true;
      }
    });

    service.getAll().subscribe(() => {});
    const req = httpTestingController.expectOne(environment.services.estados);
    req.flush(mockStates);

    subscription.unsubscribe();
    expect(emitted).toBe(true);
  });
});
