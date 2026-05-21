import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Estado } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class EstadoOrdenService {
  private readonly baseUrl = environment.services.estados;

  private mockEstados: Estado[] = [
    { id: '00000000-0000-0000-0001-000000000001', nombre: 'Pendiente',   descripcion: 'Orden registrada, pendiente de procesamiento' },
    { id: '00000000-0000-0000-0001-000000000002', nombre: 'Procesando',  descripcion: 'Orden en proceso de preparación' },
    { id: '00000000-0000-0000-0001-000000000003', nombre: 'Aprobado',    descripcion: 'Orden aprobada y lista para despacho' },
    { id: '00000000-0000-0000-0001-000000000004', nombre: 'En tránsito', descripcion: 'Orden en camino al destino' },
    { id: '00000000-0000-0000-0001-000000000005', nombre: 'Entregado',   descripcion: 'Orden entregada exitosamente al cliente' },
    { id: '00000000-0000-0000-0001-000000000006', nombre: 'Cancelado',   descripcion: 'Orden cancelada' },
  ];

  private estadosSubject = new BehaviorSubject<Estado[]>(this.mockEstados);
  estados$ = this.estadosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Estado[]> {
    return this.http.get<Estado[]>(this.baseUrl).pipe(
      tap(data => {
        const ordenEstados = data.filter(e =>
          e.tipoDeEstado?.nombre === 'orden' ||
          ['Pendiente','Procesando','Aprobado','En tránsito','Entregado','Cancelado'].includes(e.nombre)
        );
        if (ordenEstados.length > 0) {
          this.estadosSubject.next(ordenEstados);
        }
      }),
      catchError(() => of(this.mockEstados)),
    );
  }

  getSnapshot(): Estado[] { return this.estadosSubject.value; }
}
