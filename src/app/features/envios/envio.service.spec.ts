import { TestBed } from '@angular/core/testing';
import { EnvioService } from './envio.service';
import { OrdenService } from '../ordenes/orden.service';
import { of, firstValueFrom, throwError } from 'rxjs';
import { Orden, HistorialRequest } from '../../shared/models/models';

describe('EnvioService', () => {
  let service: EnvioService;
  let ordenServiceMock: any;

  const mockOrdenes: Orden[] = [
    { id: 1, estadoActual: 'En tránsito' } as Orden,
    { id: 2, estadoActual: 'Entregado' } as Orden,
    { id: 3, estadoActual: 'Aprobado' } as Orden,
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

  describe('edge cases', () => {
    it('should handle empty ordenes array', async () => {
      ordenServiceMock.ordenes$ = of([]);
      
      const ordenes = await firstValueFrom(service.getAll());
      expect(ordenes).toEqual([]);
    });

    it('should return empty array when filtering en transito with no matching states', async () => {
      ordenServiceMock.ordenes$ = of([
        { id: 1, estadoActual: 'Cancelado' } as Orden,
        { id: 2, estadoActual: 'Entregado' } as Orden,
      ]);

      const ordenes = await firstValueFrom(service.getEnTransito());
      expect(ordenes.length).toBe(0);
    });

    it('should return empty array when filtering entregadas with no matching states', async () => {
      ordenServiceMock.ordenes$ = of([
        { id: 1, estadoActual: 'En tránsito' } as Orden,
        { id: 2, estadoActual: 'Cancelado' } as Orden,
      ]);

      const ordenes = await firstValueFrom(service.getEntregadas());
      expect(ordenes.length).toBe(0);
    });

    it('should handle multiple ordenes with same estado', async () => {
      ordenServiceMock.ordenes$ = of([
        { id: 1, estadoActual: 'En tránsito' } as Orden,
        { id: 2, estadoActual: 'En tránsito' } as Orden,
        { id: 3, estadoActual: 'Entregado' } as Orden,
      ]);

      const enTransito = await firstValueFrom(service.getEnTransito());
      expect(enTransito.length).toBe(2);
      expect(enTransito.every(o => o.estadoActual === 'En tránsito')).toBe(true);
    });

    it('should pass correct parameters to agregarHistorial', async () => {
      const dto: HistorialRequest = {
        estadoNuevoId: 3,
        observacion: 'Test observation',
        ubicacion: 'Los Angeles'
      } as any;

      await firstValueFrom(service.actualizarEstado(99, dto));
      expect(ordenServiceMock.agregarHistorial).toHaveBeenCalledWith(99, dto);
    });
  });

  describe('observable subscriptions', () => {
    it('should emit all ordenes through getAll observable', () => {
      let emissions = 0;
      service.getAll().subscribe((ordenes) => {
        emissions++;
        expect(ordenes).toEqual(mockOrdenes);
      });
      
      expect(emissions).toBe(1);
    });

    it('should emit filtered ordenes through getEnTransito', () => {
      let emitted = false;
      service.getEnTransito().subscribe((ordenes) => {
        expect(ordenes.length).toBe(1);
        expect(ordenes[0].id).toBe(1);
        emitted = true;
      });
      expect(emitted).toBe(true);
    });

    it('should emit filtered ordenes through getEntregadas', () => {
      let emitted = false;
      service.getEntregadas().subscribe((ordenes) => {
        expect(ordenes.length).toBe(1);
        expect(ordenes[0].id).toBe(2);
        emitted = true;
      });
      expect(emitted).toBe(true);
    });

    it('should handle actualizarEstado subscription', () => {
      const dto: HistorialRequest = { estadoId: '1', estadoNombre: 'Pendiente' };
      let emitted = false;
      service.actualizarEstado(1, dto).subscribe((result) => {
        expect(result).toEqual({ success: true });
        emitted = true;
      });
      expect(emitted).toBe(true);
    });
  });

  describe('cargarOrdenes behavior', () => {
    it('should not error when calling cargarOrdenes', () => {
      expect(() => service.cargarOrdenes()).not.toThrow();
    });

    it('should subscribe to getAll without failing', () => {
      const getAllSpy = vi.spyOn(ordenServiceMock, 'getAll');
      service.cargarOrdenes();
      expect(getAllSpy).toHaveBeenCalled();
    });

    it('should handle error from getAll subscription', () => {
      ordenServiceMock.getAll = vi.fn().mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      expect(() => service.cargarOrdenes()).not.toThrow();
    });
  });
});
