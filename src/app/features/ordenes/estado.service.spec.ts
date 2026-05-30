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
});
