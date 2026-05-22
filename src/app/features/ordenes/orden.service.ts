import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Orden, OrdenRequest, OrdenDetalle, HistorialEntry, HistorialRequest } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class OrdenService {
  private readonly baseUrl = environment.services.ordenes;

  private mockOrdenes: Orden[] = [
    {
      id: 9820,
      fechaOrden: '2025-04-19T08:15:00',
      userNombre: 'María Torres',
      estadoActual: 'Entregado',
      total: 3480000,
      detalles: [
        { productoId: 'prod-1', cantidad: 2, productoNombre: 'Smartphone Samsung Galaxy A54', precioUnitario: 1250000, subtotal: 2500000 },
        { productoId: 'prod-2', cantidad: 1, productoNombre: 'Audífonos Sony WH-1000XM5',     precioUnitario: 980000,  subtotal: 980000  },
      ],
      historial: [
        { estadoNombre: 'Pendiente',  fecha: '2025-04-19T08:15:00' },
        { estadoNombre: 'Procesando', fecha: '2025-04-19T09:00:00' },
        { estadoNombre: 'Entregado',  fecha: '2025-04-20T14:00:00' },
      ],
    },
    {
      id: 9821,
      fechaOrden: '2025-04-19T09:30:00',
      userNombre: 'Carlos Mejía',
      estadoActual: 'En tránsito',
      total: 850000,
      detalles: [
        { productoId: 'prod-3', cantidad: 1, productoNombre: 'Silla Ergonómica Premium', precioUnitario: 850000, subtotal: 850000 },
      ],
      historial: [
        { estadoNombre: 'Pendiente',   fecha: '2025-04-19T09:30:00' },
        { estadoNombre: 'En tránsito', fecha: '2025-04-20T10:00:00' },
      ],
    },
    {
      id: 9822,
      fechaOrden: '2025-04-19T10:00:00',
      userNombre: 'Sofía Ramírez',
      estadoActual: 'Procesando',
      total: 2100000,
      detalles: [
        { productoId: 'prod-4', cantidad: 1, productoNombre: 'Monitor LG UltraWide 34"', precioUnitario: 2100000, subtotal: 2100000 },
      ],
      historial: [
        { estadoNombre: 'Pendiente',  fecha: '2025-04-19T10:00:00' },
        { estadoNombre: 'Procesando', fecha: '2025-04-19T11:00:00' },
      ],
    },
    {
      id: 9823,
      fechaOrden: '2025-04-18T14:00:00',
      userNombre: 'Andrés Castillo',
      estadoActual: 'Entregado',
      total: 555000,
      detalles: [
        { productoId: 'prod-6', cantidad: 3, productoNombre: 'Termo Stanley Adventure 1L', precioUnitario: 185000, subtotal: 555000 },
      ],
      historial: [],
    },
    {
      id: 9824,
      fechaOrden: '2025-04-18T16:30:00',
      userNombre: 'Laura Vega',
      estadoActual: 'Pendiente',
      total: 850000,
      detalles: [
        { productoId: 'prod-5', cantidad: 100, productoNombre: 'Caja de embalaje reforzada L', precioUnitario: 8500, subtotal: 850000 },
      ],
      historial: [
        { estadoNombre: 'Pendiente', fecha: '2025-04-18T16:30:00' },
      ],
    },
  ];

  private ordenesSubject = new BehaviorSubject<Orden[]>(this.mockOrdenes);
  ordenes$ = this.ordenesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Normaliza estado (backend: lowercase) a Title Case y calcula total si falta */
  private normalizeOrden(o: Orden): Orden {
    const estadoMap: Record<string, string> = {
      'pendiente':   'Pendiente',
      'procesando':  'Procesando',
      'aprobado':    'Aprobado',
      'en tránsito': 'En tránsito',
      'en transito': 'En tránsito',
      'entregado':   'Entregado',
      'cancelado':   'Cancelado',
    };
    const raw = (o.estadoActual ?? '').toLowerCase();
    const detalles = o.detalles?.map(d => ({
      ...d,
      subtotal: d.subtotal ?? +(d.precioUnitario ?? 0) * d.cantidad,
    }));
    return {
      ...o,
      estadoActual: estadoMap[raw] ?? o.estadoActual,
      detalles,
      total: o.total ?? detalles?.reduce((sum, d) => sum + (d.subtotal ?? 0), 0) ?? 0,
    };
  }

  getAll(): Observable<Orden[]> {
    return this.http.get<Orden[]>(this.baseUrl).pipe(
      tap(data => this.ordenesSubject.next(data.map(o => this.normalizeOrden(o)))),
      catchError(() => {
        this.ordenesSubject.next(this.mockOrdenes);
        return of(this.mockOrdenes);
      }),
    );
  }

  getMisOrdenes(): Observable<Orden[]> {
    return this.http.get<Orden[]>(`${this.baseUrl}/mis-ordenes`).pipe(
      tap(data => this.ordenesSubject.next(data.map(o => this.normalizeOrden(o)))),
      catchError(() => of(this.mockOrdenes)),
    );
  }

  getById(id: number): Observable<Orden> {
    return this.http.get<Orden>(`${this.baseUrl}/${id}`).pipe(
      tap(o => this.normalizeOrden(o)),
      catchError(() => of(this.mockOrdenes.find(o => o.id === id)!)),
    );
  }

  crearOrden(dto: OrdenRequest): Observable<Orden> {
    return this.http.post<Orden>(this.baseUrl, dto).pipe(
      tap(created => this.ordenesSubject.next([this.normalizeOrden(created), ...this.ordenesSubject.value])),
      catchError(() => {
        const newId = Math.max(...this.ordenesSubject.value.map(o => o.id), 0) + 1;
        const total = dto.detalles.reduce((sum, d) => sum + d.cantidad * (d.precioUnitario ?? 0), 0);
        const mock: Orden = {
          id: newId,
          fechaOrden: new Date().toISOString(),
          userNombre: dto.userNombre,
          estadoActual: 'Pendiente',
          detalles: dto.detalles,
          historial: [],
          total,
        };
        this.ordenesSubject.next([mock, ...this.ordenesSubject.value]);
        return of(mock);
      }),
    );
  }

  getHistorial(ordenId: number): Observable<HistorialEntry[]> {
    return this.http.get<HistorialEntry[]>(`${this.baseUrl}/${ordenId}/historial`).pipe(
      catchError(() => of(this.mockOrdenes.find(o => o.id === ordenId)?.historial ?? [])),
    );
  }

  agregarHistorial(ordenId: number, dto: HistorialRequest): Observable<Orden> {
    return this.http.post<Orden>(`${this.baseUrl}/${ordenId}/historial`, dto).pipe(
      tap(updatedOrden => {
        const normalized = this.normalizeOrden(updatedOrden);
        const list = this.ordenesSubject.value.map(o => o.id === ordenId ? normalized : o);
        this.ordenesSubject.next(list);
      }),
      catchError(() => {
        const entry: HistorialEntry = { estadoNombre: dto.estadoNombre, comentario: dto.comentario, fecha: new Date().toISOString() };
        const list = this.ordenesSubject.value.map(o => {
          if (o.id !== ordenId) return o;
          return { ...o, estadoActual: dto.estadoNombre, historial: [...(o.historial ?? []), entry] };
        });
        this.ordenesSubject.next(list);
        return of(list.find(o => o.id === ordenId)!);
      }),
    );
  }

  getSnapshot(): Orden[] { return this.ordenesSubject.value; }
}
