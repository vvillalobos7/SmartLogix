import { TestBed } from '@angular/core/testing';
import { InventarioService } from './inventario.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Bodega, Pasillo, Estante, EstPasi } from '../../shared/models/models';
import { firstValueFrom } from 'rxjs';

describe('InventarioService (Feature)', () => {
  let service: InventarioService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InventarioService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Bodegas', () => {
    it('should get all bodegas', async () => {
      const mockBodegas: Bodega[] = [{ idBodega: 1, nombre: 'B1', activa: true }];
      const promise = firstValueFrom(service.getBodegas());
      const req = httpTestingController.expectOne(environment.services.inventarioBodegas);
      req.flush(mockBodegas);
      const bodegas = await promise;
      expect(bodegas).toEqual(mockBodegas);
      expect(service.getSnapshot().bodegas).toEqual(mockBodegas);
    });

    it('should get active bodegas', async () => {
      const mockBodegas: Bodega[] = [{ idBodega: 1, nombre: 'B1', activa: true }];
      const promise = firstValueFrom(service.getBodegasActivas());
      const req = httpTestingController.expectOne(`${environment.services.inventarioBodegas}/activas`);
      req.flush(mockBodegas);
      const bodegas = await promise;
      expect(bodegas).toEqual(mockBodegas);
    });

    it('should get bodega by id', async () => {
      const mockBodega: Bodega = { idBodega: 1, nombre: 'B1', activa: true };
      const promise = firstValueFrom(service.getBodegaById(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioBodegas}/1`);
      req.flush(mockBodega);
      const bodega = await promise;
      expect(bodega).toEqual(mockBodega);
    });

    it('should create bodega', async () => {
      const dto = { nombre: 'B1' };
      const mockCreated = { idBodega: 1, nombre: 'B1', activa: true };
      const promise = firstValueFrom(service.createBodega(dto));
      const req = httpTestingController.expectOne(environment.services.inventarioBodegas);
      req.flush(mockCreated);
      const bodega = await promise;
      expect(bodega).toEqual(mockCreated);
    });

    it('should update bodega', async () => {
      const dto = { nombre: 'B1-updated' };
      const mockUpdated = { idBodega: 1, nombre: 'B1-updated', activa: true };
      const promise = firstValueFrom(service.updateBodega(1, dto));
      const req = httpTestingController.expectOne(`${environment.services.inventarioBodegas}/1`);
      req.flush(mockUpdated);
      const bodega = await promise;
      expect(bodega).toEqual(mockUpdated);
    });

    it('should delete bodega', async () => {
      const promise = firstValueFrom(service.deleteBodega(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioBodegas}/1`);
      req.flush(null);
      await promise;
    });

    it('should toggle bodega state', async () => {
      // Setup subject
      (service as any).bodegasSubject.next([{ idBodega: 1, nombre: 'B1', activa: true }]);
      const mockUpdated = { idBodega: 1, nombre: 'B1', activa: false };

      const promise = firstValueFrom(service.toggleBodega(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioBodegas}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.activa).toBe(false);
      req.flush(mockUpdated);

      const bodega = await promise;
      expect(bodega?.activa).toBe(false);
    });
  });

  describe('Pasillos', () => {
    it('should get all pasillos', async () => {
      const mockPasillos = [{ idPasillo: 1, codigo: 'P1', idBodega: 1 }];
      const promise = firstValueFrom(service.getPasillos());
      const req = httpTestingController.expectOne(environment.services.inventarioPasillos);
      req.flush(mockPasillos);
      const pasillos = await promise;
      expect(pasillos).toEqual(mockPasillos);
    });

    it('should get pasillos by bodega id', async () => {
      const mockPasillos = [{ idPasillo: 1, codigo: 'P1', idBodega: 1 }];
      const promise = firstValueFrom(service.getPasillosByBodega(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioPasillos}/bodega/1`);
      req.flush(mockPasillos);
      const pasillos = await promise;
      expect(pasillos).toEqual(mockPasillos);
    });

    it('should create pasillo', async () => {
      const dto = { codigo: 'P1', idBodega: 1 };
      const mockCreated = { idPasillo: 1, codigo: 'P1', idBodega: 1 };
      const promise = firstValueFrom(service.createPasillo(dto));
      const req = httpTestingController.expectOne(environment.services.inventarioPasillos);
      req.flush(mockCreated);
      const pasillo = await promise;
      expect(pasillo).toEqual(mockCreated);
    });

    it('should toggle pasillo state', async () => {
      (service as any).pasillosSubject.next([{ idPasillo: 1, codigo: 'P1', idBodega: 1, activo: true }]);
      const mockUpdated = { idPasillo: 1, codigo: 'P1', idBodega: 1, activo: false };

      const promise = firstValueFrom(service.togglePasillo(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioPasillos}/1`);
      req.flush(mockUpdated);

      const pasillo = await promise;
      expect(pasillo?.activo).toBe(false);
    });

    it('should delete pasillo', async () => {
      const promise = firstValueFrom(service.deletePasillo(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioPasillos}/1`);
      req.flush(null);
      await promise;
    });
  });

  describe('Estantes', () => {
    it('should get all estantes', async () => {
      const mockEstantes = [{ idEstante: 1, codigo: 'E1' }];
      const promise = firstValueFrom(service.getEstantes());
      const req = httpTestingController.expectOne(environment.services.inventarioEstantes);
      req.flush(mockEstantes);
      const estantes = await promise;
      expect(estantes).toEqual(mockEstantes);
    });

    it('should get estantes by pasillo id', async () => {
      const mockEstantes = [{ idEstante: 1, codigo: 'E1', idPasillo: 1 }];
      const promise = firstValueFrom(service.getEstantesByPasillo(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioEstantes}/por-pasillo/1`);
      req.flush(mockEstantes);
      const estantes = await promise;
      expect(estantes).toEqual(mockEstantes);
    });

    it('should create estante', async () => {
      const dto = { codigo: 'E1', idPasillo: 1, numNiveles: 2 };
      const mockCreated = { idEstante: 1, codigo: 'E1', idPasillo: 1, numNiveles: 2 };
      const promise = firstValueFrom(service.createEstante(dto));
      const req = httpTestingController.expectOne(environment.services.inventarioEstantes);
      req.flush(mockCreated);
      const estante = await promise;
      expect(estante).toEqual(mockCreated);
    });

    it('should delete estante', async () => {
      const promise = firstValueFrom(service.deleteEstante(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioEstantes}/1`);
      req.flush(null);
      await promise;
    });
  });

  describe('EstPasi linkage', () => {
    it('should get all estPasi links', async () => {
      const mockEstPasi = [{ idEstPasi: 1, idEstante: 10, idPasillo: 20 }];
      const promise = firstValueFrom(service.getEstPasi());
      const req = httpTestingController.expectOne(environment.services.inventarioEstPasi);
      req.flush(mockEstPasi);
      const ep = await promise;
      expect(ep).toEqual(mockEstPasi);
    });

    it('should create estPasi link', async () => {
      const dto = { idEstante: 10, idPasillo: 20 };
      const mockCreated = { idEstPasi: 1, idEstante: 10, idPasillo: 20 };
      const promise = firstValueFrom(service.createEstPasi(dto));
      const req = httpTestingController.expectOne(environment.services.inventarioEstPasi);
      req.flush(mockCreated);
      const ep = await promise;
      expect(ep).toEqual(mockCreated);
    });

    it('should create estPasi link shortcut (createEstPasiLink)', async () => {
      const mockCreated = { idEstPasi: 1, idEstante: 10, idPasillo: 20 };
      const promise = firstValueFrom(service.createEstPasiLink(10, 20));
      const req = httpTestingController.expectOne(environment.services.inventarioEstPasi);
      req.flush(mockCreated);
      const ep = await promise;
      expect(ep).toEqual(mockCreated);
    });

    it('should update estPasi', async () => {
      const dto = { idEstante: 10, idPasillo: 20, posicion: 'A' };
      const mockUpdated = { idEstPasi: 1, idEstante: 10, idPasillo: 20, posicion: 'A' };
      const promise = firstValueFrom(service.updateEstPasi(1, dto));
      const req = httpTestingController.expectOne(`${environment.services.inventarioEstPasi}/1`);
      req.flush(mockUpdated);
      const ep = await promise;
      expect(ep).toEqual(mockUpdated);
    });

    it('should delete estPasi', async () => {
      const promise = firstValueFrom(service.deleteEstPasi(1));
      const req = httpTestingController.expectOne(`${environment.services.inventarioEstPasi}/1`);
      req.flush(null);
      await promise;
    });
  });
});
