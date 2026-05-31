import { TestBed } from '@angular/core/testing';
import { OrdenService } from './orden.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Orden } from '../../shared/models/models';
import { firstValueFrom } from 'rxjs';

describe('OrdenService (Feature)', () => {
  let service: OrdenService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdenService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(OrdenService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all orders and normalize state casing in the subject', async () => {
    const rawOrders: Orden[] = [
      { id: 1, estadoActual: 'pendiente', total: 100 },
      { id: 2, estadoActual: 'aprobado', total: 200 },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.ordenes);
    expect(req.request.method).toBe('GET');
    req.flush(rawOrders);

    await promise;

    // El resultado en el subject sí está normalizado
    const normalizedOrders = service.getSnapshot();
    expect(normalizedOrders[0].estadoActual).toBe('Pendiente');
    expect(normalizedOrders[1].estadoActual).toBe('Aprobado');
  });

  it('should get client orders (getMisOrdenes) and normalize in the subject', async () => {
    const rawOrders: Orden[] = [{ id: 1, estadoActual: 'entregado' }];

    const promise = firstValueFrom(service.getMisOrdenes());
    const req = httpTestingController.expectOne(`${environment.services.ordenes}/mis-ordenes`);
    req.flush(rawOrders);

    await promise;

    const normalizedOrders = service.getSnapshot();
    expect(normalizedOrders[0].estadoActual).toBe('Entregado');
  });

  it('should get order by id (returns raw order due to tap)', async () => {
    const rawOrder: Orden = { id: 1, estadoActual: 'cancelado' };

    const promise = firstValueFrom(service.getById(1));
    const req = httpTestingController.expectOne(`${environment.services.ordenes}/1`);
    req.flush(rawOrder);

    const order = await promise;
    expect(order.estadoActual).toBe('cancelado'); // tap no transforma el valor devuelto
  });

  it('should create order and append normalized version to subject', async () => {
    const dto = { detalles: [{ productoId: 'p1', cantidad: 2 }] };
    const rawOrder: Orden = { id: 1, estadoActual: 'pendiente', detalles: [{ productoId: 'p1', cantidad: 2, precioUnitario: 50, subtotal: 100 }] };

    const promise = firstValueFrom(service.crearOrden(dto));
    const req = httpTestingController.expectOne(environment.services.ordenes);
    expect(req.request.method).toBe('POST');
    req.flush(rawOrder);

    const order = await promise;
    expect(order.id).toBe(1);

    const snapshot = service.getSnapshot();
    expect(snapshot[0].estadoActual).toBe('Pendiente'); // normalized in subject
    expect(snapshot[0].total).toBe(100);
  });

  it('should take order (tomarOrden)', async () => {
    const rawOrder: Orden = { id: 1, estadoActual: 'en tránsito' };

    const promise = firstValueFrom(service.tomarOrden(1));
    const req = httpTestingController.expectOne(`${environment.services.ordenes}/1/tomar`);
    expect(req.request.method).toBe('POST');
    req.flush(rawOrder);

    const order = await promise;
    expect(order.estadoActual).toBe('en tránsito'); // tap no transforma el valor devuelto
  });

  it('should release order (liberarOrden)', async () => {
    const rawOrder: Orden = { id: 1, estadoActual: 'aprobado' };

    const promise = firstValueFrom(service.liberarOrden(1));
    const req = httpTestingController.expectOne(`${environment.services.ordenes}/1/liberar`);
    expect(req.request.method).toBe('POST');
    req.flush(rawOrder);

    const order = await promise;
    expect(order.estadoActual).toBe('aprobado'); // tap no transforma el valor devuelto
  });
});
