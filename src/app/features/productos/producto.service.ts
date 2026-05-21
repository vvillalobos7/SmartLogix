import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto, ProductoRequest, Categoria } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly baseUrl = environment.services.productos;
  private readonly categoriasUrl = environment.services.categorias;

  private mockCategorias: Categoria[] = [
    { id: 'cat-1', nombre: 'Electrónica',  descripcion: 'Dispositivos electrónicos' },
    { id: 'cat-2', nombre: 'Mobiliario',   descripcion: 'Muebles y accesorios de oficina' },
    { id: 'cat-3', nombre: 'Embalaje',     descripcion: 'Materiales de empaque' },
    { id: 'cat-4', nombre: 'Hogar',        descripcion: 'Artículos para el hogar' },
  ];

  private mockProductos: Producto[] = [
    { id: 'prod-1', nombre: 'Smartphone Samsung Galaxy A54', descripcion: 'Teléfono 256GB, AMOLED 6.4"', precio: 1250000, stock: 85,  categoriaId: 'cat-1', categoriaNombre: 'Electrónica', estadoNombre: 'Activo', activo: true },
    { id: 'prod-2', nombre: 'Audífonos Sony WH-1000XM5',    descripcion: 'Inalámbricos, cancelación de ruido', precio: 980000, stock: 12, categoriaId: 'cat-1', categoriaNombre: 'Electrónica', estadoNombre: 'Activo', activo: true },
    { id: 'prod-3', nombre: 'Silla Ergonómica Premium',     descripcion: 'Con soporte lumbar, reposabrazos 4D', precio: 850000, stock: 0,  categoriaId: 'cat-2', categoriaNombre: 'Mobiliario',  estadoNombre: 'Activo', activo: true },
    { id: 'prod-4', nombre: 'Monitor LG UltraWide 34"',    descripcion: '3440x1440 IPS, 160Hz',               precio: 2100000, stock: 34, categoriaId: 'cat-1', categoriaNombre: 'Electrónica', estadoNombre: 'Activo', activo: true },
    { id: 'prod-5', nombre: 'Caja de embalaje reforzada L', descripcion: 'Cartón doble pared 60x40x30cm',      precio: 8500,    stock: 850, categoriaId: 'cat-3', categoriaNombre: 'Embalaje',    estadoNombre: 'Activo', activo: true },
    { id: 'prod-6', nombre: 'Termo Stanley Adventure 1L',   descripcion: 'Acero inoxidable, 24h frío',         precio: 185000,  stock: 7,   categoriaId: 'cat-4', categoriaNombre: 'Hogar',       estadoNombre: 'Activo', activo: true },
  ];

  private productosSubject = new BehaviorSubject<Producto[]>(this.mockProductos);
  productos$ = this.productosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl).pipe(
      tap(data => this.productosSubject.next(data)),
      catchError(() => {
        this.productosSubject.next(this.mockProductos);
        return of(this.mockProductos);
      }),
    );
  }

  getById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.mockProductos.find(p => p.id === id);
        return found ? of(found) : throwError(() => new Error('Producto no encontrado'));
      }),
    );
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.categoriasUrl).pipe(
      catchError(() => of(this.mockCategorias)),
    );
  }

  create(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, dto).pipe(
      tap(created => this.productosSubject.next([...this.productosSubject.value, created])),
      catchError(() => {
        const cat = this.mockCategorias.find(c => c.id === dto.categoriaId);
        const mock: Producto = {
          id: `prod-${Date.now()}`,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          precio: dto.precio,
          stock: dto.stock,
          categoriaId: dto.categoriaId,
          categoriaNombre: cat?.nombre,
          estadoNombre: dto.estadoNombre ?? 'Activo',
          activo: true,
        };
        this.productosSubject.next([...this.productosSubject.value, mock]);
        return of(mock);
      }),
    );
  }

  update(id: string, dto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(updated => {
        const list = this.productosSubject.value.map(p => p.id === id ? updated : p);
        this.productosSubject.next(list);
      }),
      catchError(() => {
        const cat = this.mockCategorias.find(c => c.id === dto.categoriaId);
        const list = this.productosSubject.value.map(p =>
          p.id === id ? { ...p, ...dto, categoriaNombre: cat?.nombre ?? p.categoriaNombre } : p,
        );
        this.productosSubject.next(list);
        return of(list.find(p => p.id === id)!);
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.productosSubject.next(this.productosSubject.value.filter(p => p.id !== id))),
      catchError(() => {
        this.productosSubject.next(this.productosSubject.value.filter(p => p.id !== id));
        return of(undefined);
      }),
    );
  }

  toggleActivo(id: string): Observable<Producto> {
    return this.http.patch<Producto>(`${this.baseUrl}/${id}/toggle-activo`, {}).pipe(
      tap(updated => {
        const list = this.productosSubject.value.map(p => p.id === id ? updated : p);
        this.productosSubject.next(list);
      }),
      catchError(() => {
        const list = this.productosSubject.value.map(p =>
          p.id === id ? { ...p, activo: !p.activo } : p,
        );
        this.productosSubject.next(list);
        return of(list.find(p => p.id === id)!);
      }),
    );
  }

  subirImagen(id: string, file: File): Observable<Producto> {
    const formData = new FormData();
    formData.append('imagen', file);
    return this.http.post<Producto>(`${this.baseUrl}/${id}/imagen`, formData).pipe(
      tap(updated => {
        const list = this.productosSubject.value.map(p => p.id === id ? updated : p);
        this.productosSubject.next(list);
      }),
      catchError(() => {
        const url = URL.createObjectURL(file);
        const list = this.productosSubject.value.map(p => p.id === id ? { ...p, imagenUrl: url } : p);
        this.productosSubject.next(list);
        return of(list.find(p => p.id === id)!);
      }),
    );
  }

  eliminarImagen(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/imagen`).pipe(
      tap(() => {
        const list = this.productosSubject.value.map(p => p.id === id ? { ...p, imagenUrl: undefined } : p);
        this.productosSubject.next(list);
      }),
      catchError(() => {
        const list = this.productosSubject.value.map(p => p.id === id ? { ...p, imagenUrl: undefined } : p);
        this.productosSubject.next(list);
        return of(undefined);
      }),
    );
  }

  getSnapshot(): Producto[] { return this.productosSubject.value; }
}
