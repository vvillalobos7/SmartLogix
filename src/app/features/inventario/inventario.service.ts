import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Bodega, BodegaRequest,
  Pasillo, PasilloRequest,
  Estante, EstanteRequest,
  EstPasi, EstPasiRequest,
} from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly urlBodegas  = environment.services.inventarioBodegas;
  private readonly urlPasillos = environment.services.inventarioPasillos;
  private readonly urlEstantes = environment.services.inventarioEstantes;
  private readonly urlEstPasi  = environment.services.inventarioEstPasi;

  private bodegasSubject  = new BehaviorSubject<Bodega[]>([]);
  private pasillosSubject = new BehaviorSubject<Pasillo[]>([]);
  private estantesSubject = new BehaviorSubject<Estante[]>([]);
  private estPasiSubject  = new BehaviorSubject<EstPasi[]>([]);

  bodegas$  = this.bodegasSubject.asObservable();
  pasillos$ = this.pasillosSubject.asObservable();
  estantes$ = this.estantesSubject.asObservable();
  estPasi$  = this.estPasiSubject.asObservable();

  constructor(private http: HttpClient) {}

  // --- BODEGAS ---

  getBodegas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(this.urlBodegas).pipe(
      tap(data => this.bodegasSubject.next(data)),
      catchError(() => of([])),
    );
  }

  getBodegasActivas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.urlBodegas}/activas`).pipe(
      catchError(() => of([])),
    );
  }

  getBodegaById(id: number): Observable<Bodega | undefined> {
    return this.http.get<Bodega>(`${this.urlBodegas}/${id}`).pipe(
      catchError(() => of(undefined)),
    );
  }

  createBodega(dto: BodegaRequest): Observable<Bodega | null> {
    return this.http.post<Bodega>(this.urlBodegas, dto).pipe(
      tap(b => this.bodegasSubject.next([...this.bodegasSubject.value, b])),
      catchError(() => of(null)),
    );
  }

  updateBodega(id: number, dto: BodegaRequest): Observable<Bodega | null> {
    return this.http.put<Bodega>(`${this.urlBodegas}/${id}`, dto).pipe(
      tap(b => this.bodegasSubject.next(this.bodegasSubject.value.map(x => x.idBodega === id ? b : x))),
      catchError(() => of(null)),
    );
  }

  deleteBodega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBodegas}/${id}`).pipe(
      tap(() => this.bodegasSubject.next(this.bodegasSubject.value.filter(b => b.idBodega !== id))),
      catchError(() => {
        this.bodegasSubject.next(this.bodegasSubject.value.filter(b => b.idBodega !== id));
        return of(undefined);
      }),
    );
  }

  toggleBodega(id: number): Observable<Bodega | null> {
    const current = this.bodegasSubject.value.find(b => b.idBodega === id);
    if (!current) return of(null);
    const dto: BodegaRequest = {
      nombre: current.nombre,
      direccion: current.direccion,
      ciudad: current.ciudad,
      pais: current.pais,
      capacidadTotal: current.capacidadTotal,
      activa: !current.activa,
    };
    return this.http.put<Bodega>(`${this.urlBodegas}/${id}`, dto).pipe(
      tap(b => this.bodegasSubject.next(this.bodegasSubject.value.map(x => x.idBodega === id ? b : x))),
      catchError(() => of(null)),
    );
  }

  // --- PASILLOS ---

  getPasillos(): Observable<Pasillo[]> {
    return this.http.get<Pasillo[]>(this.urlPasillos).pipe(
      tap(data => this.pasillosSubject.next(data)),
      catchError(() => of([])),
    );
  }

  getPasillosByBodega(bodegaId: number): Observable<Pasillo[]> {
    return this.http.get<Pasillo[]>(`${this.urlPasillos}/bodega/${bodegaId}`).pipe(
      catchError(() => of([])),
    );
  }

  createPasillo(dto: PasilloRequest): Observable<Pasillo | null> {
    return this.http.post<Pasillo>(this.urlPasillos, dto).pipe(
      tap(p => this.pasillosSubject.next([...this.pasillosSubject.value, p])),
      catchError(() => of(null)),
    );
  }

  updatePasillo(id: number, dto: PasilloRequest): Observable<Pasillo | null> {
    return this.http.put<Pasillo>(`${this.urlPasillos}/${id}`, dto).pipe(
      tap(p => this.pasillosSubject.next(this.pasillosSubject.value.map(x => x.idPasillo === id ? p : x))),
      catchError(() => of(null)),
    );
  }

  togglePasillo(id: number): Observable<Pasillo | null> {
    const current = this.pasillosSubject.value.find(p => p.idPasillo === id);
    if (!current) return of(null);
    const dto: PasilloRequest = {
      codigo: current.codigo,
      descripcion: current.descripcion,
      numeroOrden: current.numeroOrden,
      idBodega: current.idBodega!,
      activo: !current.activo,
    };
    return this.updatePasillo(id, dto);
  }

  deletePasillo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlPasillos}/${id}`).pipe(
      tap(() => this.pasillosSubject.next(this.pasillosSubject.value.filter(p => p.idPasillo !== id))),
      catchError(() => {
        this.pasillosSubject.next(this.pasillosSubject.value.filter(p => p.idPasillo !== id));
        return of(undefined);
      }),
    );
  }

  // --- ESTANTES ---

  getEstantes(): Observable<Estante[]> {
    return this.http.get<Estante[]>(this.urlEstantes).pipe(
      tap(data => this.estantesSubject.next(data)),
      catchError(() => of([])),
    );
  }

  getEstantesByPasillo(pasilloId: number): Observable<Estante[]> {
    return this.http.get<Estante[]>(`${this.urlEstantes}/por-pasillo/${pasilloId}`).pipe(
      catchError(() => of([])),
    );
  }

  createEstante(dto: EstanteRequest): Observable<Estante | null> {
    return this.http.post<Estante>(this.urlEstantes, dto).pipe(
      tap(e => this.estantesSubject.next([...this.estantesSubject.value, e])),
      catchError(() => of(null)),
    );
  }

  deleteEstante(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlEstantes}/${id}`).pipe(
      tap(() => this.estantesSubject.next(this.estantesSubject.value.filter(e => e.idEstante !== id))),
      catchError(() => {
        this.estantesSubject.next(this.estantesSubject.value.filter(e => e.idEstante !== id));
        return of(undefined);
      }),
    );
  }

  // --- EST-PASI ---

  getEstPasi(): Observable<EstPasi[]> {
    return this.http.get<EstPasi[]>(this.urlEstPasi).pipe(
      tap(data => this.estPasiSubject.next(data)),
      catchError(() => of([])),
    );
  }

  createEstPasi(dto: EstPasiRequest): Observable<EstPasi | null> {
    return this.http.post<EstPasi>(this.urlEstPasi, dto).pipe(
      tap(ep => this.estPasiSubject.next([...this.estPasiSubject.value, ep])),
      catchError(() => of(null)),
    );
  }

  createEstPasiLink(idEstante: number, idPasillo: number): Observable<EstPasi | null> {
    return this.createEstPasi({ idEstante, idPasillo });
  }

  updateEstPasi(id: number, dto: EstPasiRequest): Observable<EstPasi | null> {
    return this.http.put<EstPasi>(`${this.urlEstPasi}/${id}`, dto).pipe(
      tap(ep => this.estPasiSubject.next(this.estPasiSubject.value.map(x => x.idEstPasi === id ? ep : x))),
      catchError(() => of(null)),
    );
  }

  deleteEstPasi(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlEstPasi}/${id}`).pipe(
      tap(() => this.estPasiSubject.next(this.estPasiSubject.value.filter(ep => ep.idEstPasi !== id))),
      catchError(() => {
        this.estPasiSubject.next(this.estPasiSubject.value.filter(ep => ep.idEstPasi !== id));
        return of(undefined);
      }),
    );
  }

  getSnapshot() {
    return {
      bodegas: this.bodegasSubject.value,
      pasillos: this.pasillosSubject.value,
      estantes: this.estantesSubject.value,
    };
  }
}
