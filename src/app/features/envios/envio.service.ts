import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrdenService } from '../ordenes/orden.service';
import { Orden, HistorialRequest } from '../../shared/models/models';

// Los envíos se gestionan a través del historial de órdenes en svc-ordenes :8084
// No existe microservicio separado de envíos.

export const ESTADOS_ENVIO = ['En tránsito', 'Entregado', 'Aprobado', 'Cancelado'] as const;

@Injectable({ providedIn: 'root' })
export class EnvioService {
  constructor(private ordenService: OrdenService) {}

  getAll(): Observable<Orden[]> {
    return this.ordenService.ordenes$;
  }

  getEnTransito(): Observable<Orden[]> {
    return this.ordenService.ordenes$.pipe(
      map(ordenes => ordenes.filter(o => o.estadoActual === 'En tránsito')),
    );
  }

  getEntregadas(): Observable<Orden[]> {
    return this.ordenService.ordenes$.pipe(
      map(ordenes => ordenes.filter(o => o.estadoActual === 'Entregado')),
    );
  }

  actualizarEstado(ordenId: number, dto: HistorialRequest): Observable<unknown> {
    return this.ordenService.agregarHistorial(ordenId, dto);
  }

  cargarOrdenes(): void {
    this.ordenService.getAll().subscribe();
  }
}
