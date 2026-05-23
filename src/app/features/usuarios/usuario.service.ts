import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioRequest, Rol } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly baseUrl = environment.services.usuarios;

  private mockUsuarios: Usuario[] = [
    { id: 'uuid-admin-001',         nombre: 'Carlos',  apellido: 'Administrador', correo: 'admin@smartlogix.cl',         rolNombre: 'admin',         activo: true  },
    { id: 'uuid-bodeguero-001',     nombre: 'Juan',    apellido: 'Bodeguero',     correo: 'bodeguero@smartlogix.cl',     rolNombre: 'bodeguero',     activo: true  },
    { id: 'uuid-transportista-001', nombre: 'Pedro',   apellido: 'Transportista', correo: 'transportista@smartlogix.cl', rolNombre: 'transportista', activo: true  },
    { id: 'uuid-cliente-001',       nombre: 'Ana',     apellido: 'Cliente',       correo: 'cliente@smartlogix.cl',       rolNombre: 'cliente',       activo: true  },
    { id: 'uuid-inactivo-001',      nombre: 'Luis',    apellido: 'Inactivo',      correo: 'inactivo@smartlogix.cl',      rolNombre: 'cliente',       activo: false },
  ];

  private usuariosSubject = new BehaviorSubject<Usuario[]>(this.mockUsuarios);
  usuarios$ = this.usuariosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl).pipe(
      tap(data => this.usuariosSubject.next(data)),
      catchError(() => { this.usuariosSubject.next(this.mockUsuarios); return of(this.mockUsuarios); }),
    );
  }

  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => of(this.mockUsuarios.find(u => u.id === id)!)),
    );
  }

  getByCorreo(correo: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/correo/${correo}`);
  }

  create(dto: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, dto).pipe(
      tap(u => this.usuariosSubject.next([...this.usuariosSubject.value, u])),
      catchError(() => {
        const mock: Usuario = { ...dto, id: `uuid-${Date.now()}`, activo: true };
        this.usuariosSubject.next([...this.usuariosSubject.value, mock]);
        return of(mock);
      }),
    );
  }

  update(id: string, dto: Partial<UsuarioRequest>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(u => this.usuariosSubject.next(this.usuariosSubject.value.map(x => x.id === id ? u : x))),
      catchError(() => {
        const list = this.usuariosSubject.value.map(u => u.id === id ? { ...u, ...dto } : u);
        this.usuariosSubject.next(list);
        return of(list.find(u => u.id === id)!);
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.usuariosSubject.next(this.usuariosSubject.value.filter(u => u.id !== id))),
      catchError(() => { this.usuariosSubject.next(this.usuariosSubject.value.filter(u => u.id !== id)); return of(undefined); }),
    );
  }

  toggleActivo(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/toggle-activo`, {}).pipe(
      tap(u => this.usuariosSubject.next(this.usuariosSubject.value.map(x => x.id === id ? u : x))),
      catchError(() => {
        const list = this.usuariosSubject.value.map(u =>
          u.id === id ? { ...u, activo: !u.activo } : u,
        );
        this.usuariosSubject.next(list);
        return of(list.find(u => u.id === id)!);
      }),
    );
  }

  asignarRol(id: string, rolId: string, rolNombre: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/${id}/asignar-rol`, { rolId, rolNombre }).pipe(
      tap(u => this.usuariosSubject.next(this.usuariosSubject.value.map(x => x.id === id ? u : x))),
      catchError(() => {
        const list = this.usuariosSubject.value.map(u => u.id === id ? { ...u, rolNombre } : u);
        this.usuariosSubject.next(list);
        return of(list.find(u => u.id === id)!);
      }),
    );
  }

  getInitials(nombre: string): string {
    return (nombre ?? 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getSnapshot(): Usuario[] { return this.usuariosSubject.value; }
}

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly baseUrl = environment.services.roles;

  private mockRoles: Rol[] = [
    { id: 'rol-admin',         nombre: 'admin',         descripcion: 'Acceso total al sistema.'                   },
    { id: 'rol-bodeguero',     nombre: 'bodeguero',     descripcion: 'Gestión operativa: productos e inventario.' },
    { id: 'rol-transportista', nombre: 'transportista', descripcion: 'Gestión de órdenes y estados de envío.'    },
    { id: 'rol-cliente',       nombre: 'cliente',       descripcion: 'Solo puede ver y crear sus propias órdenes.' },
  ];

  private rolesSubject = new BehaviorSubject<Rol[]>(this.mockRoles);
  roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.baseUrl).pipe(
      tap(data => this.rolesSubject.next(data)),
      catchError(() => { this.rolesSubject.next(this.mockRoles); return of(this.mockRoles); }),
    );
  }

  getById(id: string): Rol | undefined {
    return this.rolesSubject.value.find(r => r.id === id);
  }

  create(dto: Omit<Rol, 'id'>): Observable<Rol> {
    return this.http.post<Rol>(this.baseUrl, dto).pipe(
      tap(r => this.rolesSubject.next([...this.rolesSubject.value, r])),
      catchError(() => {
        const mock: Rol = { ...dto, id: `rol-${Date.now()}` };
        this.rolesSubject.next([...this.rolesSubject.value, mock]);
        return of(mock);
      }),
    );
  }

  update(id: string, dto: Partial<Rol>): Observable<Rol> {
    return this.http.put<Rol>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(r => this.rolesSubject.next(this.rolesSubject.value.map(x => x.id === id ? r : x))),
      catchError(() => {
        const list = this.rolesSubject.value.map(r => r.id === id ? { ...r, ...dto } : r);
        this.rolesSubject.next(list);
        return of(list.find(r => r.id === id)!);
      }),
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.rolesSubject.next(this.rolesSubject.value.filter(r => r.id !== id))),
      catchError(() => { this.rolesSubject.next(this.rolesSubject.value.filter(r => r.id !== id)); return of(undefined); }),
    );
  }

  getSnapshot(): Rol[] { return this.rolesSubject.value; }
}
