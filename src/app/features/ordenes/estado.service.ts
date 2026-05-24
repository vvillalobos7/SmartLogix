import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Estado } from '../../shared/models/models';

const ORDEN_NOMBRES = new Set(['Pendiente','Procesando','Aprobado','En tránsito','Entregado','Cancelado']);

@Injectable({ providedIn: 'root' })
export class EstadoOrdenService {
  private readonly baseUrl = environment.services.estados;

  private readonly mockEstados: Estado[] = [
    { id: '00000000-0000-0000-0001-000000000001', nombre: 'Pendiente',   descripcion: 'Orden registrada, pendiente de procesamiento' },
    { id: '00000000-0000-0000-0001-000000000002', nombre: 'Procesando',  descripcion: 'Orden en proceso de preparación' },
    { id: '00000000-0000-0000-0001-000000000003', nombre: 'Aprobado',    descripcion: 'Orden aprobada y lista para despacho' },
    { id: '00000000-0000-0000-0001-000000000004', nombre: 'En tránsito', descripcion: 'Orden en camino al destino' },
    { id: '00000000-0000-0000-0001-000000000005', nombre: 'Entregado',   descripcion: 'Orden entregada exitosamente al cliente' },
    { id: '00000000-0000-0000-0001-000000000006', nombre: 'Cancelado',   descripcion: 'Orden cancelada' },
  ];

  private readonly estadosSubject = new BehaviorSubject<Estado[]>(this.mockEstados);
  estados$ = this.estadosSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Estado[]> {
    return this.http.get<Estado[]>(this.baseUrl).pipe(
      map(data => {
        const filtered = data.filter(e =>
          e.tipoDeEstado?.nombre === 'orden' || ORDEN_NOMBRES.has(e.nombre)
        );
        return filtered.length > 0 ? filtered : this.mockEstados;
      }),
      tap(result => this.estadosSubject.next(result)),
      catchError(() => of(this.mockEstados)),
    );
  }

  getSnapshot(): Estado[] { return this.estadosSubject.value; }
}
