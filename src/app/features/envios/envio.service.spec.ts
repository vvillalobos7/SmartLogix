import { TestBed } from '@angular/core/testing';
import { EnvioService } from './envio.service';
import { OrdenService } from '../ordenes/orden.service';
import { of, firstValueFrom } from 'rxjs';
import { Orden, HistorialRequest } from '../../shared/models/models';

describe('EnvioService', () => {
  let service: EnvioService;
  let ordenServiceMock: any;

  const mockOrdenes: Orden[] = [
    { id: 1, trackingNumber: 'TRK001', estadoActual: 'En tránsito' } as Orden,
    { id: 2, trackingNumber: 'TRK002', estadoActual: 'Entregado' } as Orden,
    { id: 3, trackingNumber: 'TRK003', estadoActual: 'Aprobado' } as Orden,
  ];

  beforeEach(() => {
    ordenServiceMock = {
      ordenes$: of(mockOrdenes),
      getAll: vi.fn().mockReturnValue(of(mockOrdenes)),
      agregarHistorial: vi.fn().mockReturnValue(of({ success: true })),
    };

    TestBed.configureTestingModule({
      providers: [
        EnvioService,
        { provide: OrdenService, useValue: ordenServiceMock }
      ]
    });

    service = TestBed.inject(EnvioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all ordenes', async () => {
    const ordenes = await firstValueFrom(service.getAll());
    expect(ordenes).toEqual(mockOrdenes);
  });

  it('should filter en transito ordenes', async () => {
    const ordenes = await firstValueFrom(service.getEnTransito());
    expect(ordenes.length).toBe(1);
    expect(ordenes[0].estadoActual).toBe('En tránsito');
  });

  it('should filter entregadas ordenes', async () => {
    const ordenes = await firstValueFrom(service.getEntregadas());
    expect(ordenes.length).toBe(1);
    expect(ordenes[0].estadoActual).toBe('Entregado');
  });

  it('should call agregarHistorial on actualizarEstado', async () => {
    const dto: HistorialRequest = { estadoNuevoId: 2, observacion: 'Ok', ubicacion: 'Stgo' } as any;
    const res = await firstValueFrom(service.actualizarEstado(1, dto));
    expect(ordenServiceMock.agregarHistorial).toHaveBeenCalledWith(1, dto);
    expect(res).toBeDefined();
  });

  it('should call ordenService.getAll on cargarOrdenes', () => {
    service.cargarOrdenes();
    expect(ordenServiceMock.getAll).toHaveBeenCalled();
  });
});
