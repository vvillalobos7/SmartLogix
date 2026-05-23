import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bodega, BodegaRequest, Pasillo, PasilloRequest, Estante, EstanteRequest } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly urlBodegas  = environment.services.inventarioBodegas;
  private readonly urlPasillos = environment.services.inventarioPasillos;
  private readonly urlEstantes = environment.services.inventarioEstantes;
  private readonly urlEstPasi  = environment.services.inventarioEstPasi;

  private mockBodegas: Bodega[] = [
    { idBodega: 1, nombre: 'Bodega Norte',       direccion: 'Calle 80 # 45-12', ciudad: 'Bogotá',       pais: 'Colombia', capacidadTotal: 5000, activa: true,  totalPasillos: 2 },
    { idBodega: 2, nombre: 'Bodega Sur',          direccion: 'Av. 68 # 12-34',   ciudad: 'Bogotá',       pais: 'Colombia', capacidadTotal: 3000, activa: true,  totalPasillos: 1 },
    { idBodega: 3, nombre: 'Bodega Puerto',       direccion: 'Zona Franca Lote 5',ciudad: 'Barranquilla', pais: 'Colombia', capacidadTotal: 8000, activa: true,  totalPasillos: 0 },
    { idBodega: 4, nombre: 'Bodega Eje Cafetero', direccion: 'Carrera 23 # 19-01',ciudad: 'Manizales',   pais: 'Colombia', capacidadTotal: 2000, activa: false, totalPasillos: 0 },
  ];

  private mockPasillos: Pasillo[] = [
    { idPasillo: 1, codigo: 'A', descripcion: 'Pasillo A', numeroOrden: 1, activo: true,  idBodega: 1, nombreBodega: 'Bodega Norte', totalEstantes: 2 },
    { idPasillo: 2, codigo: 'B', descripcion: 'Pasillo B', numeroOrden: 2, activo: true,  idBodega: 1, nombreBodega: 'Bodega Norte', totalEstantes: 1 },
    { idPasillo: 3, codigo: 'A', descripcion: 'Pasillo A', numeroOrden: 1, activo: true,  idBodega: 2, nombreBodega: 'Bodega Sur',   totalEstantes: 1 },
  ];

  private mockEstantes: Estante[] = [
    { idEstante: 1, codigo: 'E1', descripcion: 'Estante 1', numNiveles: 5, capacidadPorNivel: 100, capacidadTotal: 500, activo: true,  idPasillo: 1 },
    { idEstante: 2, codigo: 'E2', descripcion: 'Estante 2', numNiveles: 5, capacidadPorNivel: 100, capacidadTotal: 500, activo: true,  idPasillo: 1 },
    { idEstante: 3, codigo: 'E1', descripcion: 'Estante 1', numNiveles: 3, capacidadPorNivel: 80,  capacidadTotal: 240, activo: true,  idPasillo: 2 },
    { idEstante: 4, codigo: 'E1', descripcion: 'Estante 1', numNiveles: 4, capacidadPorNivel: 90,  capacidadTotal: 360, activo: false, idPasillo: 3 },
  ];

  private bodegasSubject  = new BehaviorSubject<Bodega[]>(this.mockBodegas);
  private pasillosSubject = new BehaviorSubject<Pasillo[]>(this.mockPasillos);
  private estantesSubject = new BehaviorSubject<Estante[]>(this.mockEstantes);

  bodegas$  = this.bodegasSubject.asObservable();
  pasillos$ = this.pasillosSubject.asObservable();
  estantes$ = this.estantesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // --- BODEGAS ---

  getBodegas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(this.urlBodegas).pipe(
      tap(data => this.bodegasSubject.next(data)),
      catchError(() => { this.bodegasSubject.next(this.mockBodegas); return of(this.mockBodegas); }),
    );
  }

  getBodegasActivas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.urlBodegas}/activas`).pipe(
      catchError(() => of(this.mockBodegas.filter(b => b.activa))),
    );
  }

  getBodegaById(id: number): Observable<Bodega> {
    return this.http.get<Bodega>(`${this.urlBodegas}/${id}`).pipe(
      catchError(() => of(this.mockBodegas.find(b => b.idBodega === id)!)),
    );
  }

  createBodega(dto: BodegaRequest): Observable<Bodega> {
    return this.http.post<Bodega>(this.urlBodegas, dto).pipe(
      tap(b => this.bodegasSubject.next([...this.bodegasSubject.value, b])),
      catchError(() => {
        const mock: Bodega = { ...dto, idBodega: Date.now(), activa: true, totalPasillos: 0 };
        this.bodegasSubject.next([...this.bodegasSubject.value, mock]);
        return of(mock);
      }),
    );
  }

  updateBodega(id: number, dto: BodegaRequest): Observable<Bodega> {
    return this.http.put<Bodega>(`${this.urlBodegas}/${id}`, dto).pipe(
      tap(b => this.bodegasSubject.next(this.bodegasSubject.value.map(x => x.idBodega === id ? b : x))),
      catchError(() => {
        const list = this.bodegasSubject.value.map(b => b.idBodega === id ? { ...b, ...dto } : b);
        this.bodegasSubject.next(list);
        return of(list.find(b => b.idBodega === id)!);
      }),
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

  toggleBodega(id: number): Observable<Bodega> {
    const current = this.bodegasSubject.value.find(b => b.idBodega === id);
    if (!current) return of(undefined as any);
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
      catchError(() => {
        const list = this.bodegasSubject.value.map(b =>
          b.idBodega === id ? { ...b, activa: !b.activa } : b,
        );
        this.bodegasSubject.next(list);
        return of(list.find(b => b.idBodega === id)!);
      }),
    );
  }

  // --- PASILLOS ---

  getPasillos(): Observable<Pasillo[]> {
    return this.http.get<Pasillo[]>(this.urlPasillos).pipe(
      tap(data => this.pasillosSubject.next(data)),
      catchError(() => { this.pasillosSubject.next(this.mockPasillos); return of(this.mockPasillos); }),
    );
  }

  getPasillosByBodega(bodegaId: number): Observable<Pasillo[]> {
    return this.http.get<Pasillo[]>(`${this.urlPasillos}/bodega/${bodegaId}`).pipe(
      catchError(() => of(this.mockPasillos.filter(p => p.idBodega === bodegaId))),
    );
  }

  createPasillo(dto: PasilloRequest): Observable<Pasillo> {
    return this.http.post<Pasillo>(this.urlPasillos, dto).pipe(
      tap(p => this.pasillosSubject.next([...this.pasillosSubject.value, p])),
      catchError(() => {
        const bodega = this.bodegasSubject.value.find(b => b.idBodega === dto.idBodega);
        const mock: Pasillo = { ...dto, idPasillo: Date.now(), activo: true, nombreBodega: bodega?.nombre, totalEstantes: 0 };
        this.pasillosSubject.next([...this.pasillosSubject.value, mock]);
        return of(mock);
      }),
    );
  }

  updatePasillo(id: number, dto: PasilloRequest): Observable<Pasillo> {
    return this.http.put<Pasillo>(`${this.urlPasillos}/${id}`, dto).pipe(
      tap(p => this.pasillosSubject.next(this.pasillosSubject.value.map(x => x.idPasillo === id ? p : x))),
      catchError(() => {
        const list = this.pasillosSubject.value.map(p => p.idPasillo === id ? { ...p, ...dto } : p);
        this.pasillosSubject.next(list);
        return of(list.find(p => p.idPasillo === id)!);
      }),
    );
  }

  togglePasillo(id: number): Observable<Pasillo> {
    const current = this.pasillosSubject.value.find(p => p.idPasillo === id);
    if (!current) return of(undefined as any);
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
      catchError(() => { this.estantesSubject.next(this.mockEstantes); return of(this.mockEstantes); }),
    );
  }

  getEstantesByPasillo(pasilloId: number): Observable<Estante[]> {
    return this.http.get<Estante[]>(`${this.urlEstantes}/por-pasillo/${pasilloId}`).pipe(
      catchError(() => of(this.mockEstantes.filter(e => e.idPasillo === pasilloId))),
    );
  }

  createEstante(dto: EstanteRequest): Observable<Estante> {
    return this.http.post<Estante>(this.urlEstantes, dto).pipe(
      tap(e => this.estantesSubject.next([...this.estantesSubject.value, e])),
      catchError(() => {
        const mock: Estante = {
          ...dto,
          idEstante: Date.now(),
          activo: true,
          capacidadTotal: (dto.numNiveles ?? 1) * (dto.capacidadPorNivel ?? 0),
        };
        this.estantesSubject.next([...this.estantesSubject.value, mock]);
        return of(mock);
      }),
    );
  }

  createEstPasiLink(idEstante: number, idPasillo: number): Observable<unknown> {
    return this.http.post(this.urlEstPasi, { idEstante, idPasillo }).pipe(
      tap(() => {
        const list = this.estantesSubject.value.map(e =>
          e.idEstante === idEstante ? { ...e, idPasillo } : e,
        );
        this.estantesSubject.next(list);
      }),
      catchError(() => {
        const list = this.estantesSubject.value.map(e =>
          e.idEstante === idEstante ? { ...e, idPasillo } : e,
        );
        this.estantesSubject.next(list);
        return of(undefined);
      }),
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

  getSnapshot() {
    return {
      bodegas: this.bodegasSubject.value,
      pasillos: this.pasillosSubject.value,
      estantes: this.estantesSubject.value,
    };
  }
}
