import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Usuario, Rol, Permiso } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private mockData: Usuario[] = [
    { id_usuario: 1, nombre: 'Carlos Administrador', email: 'admin@softyz.co',      fec_registro: '2024-01-15', id_rol: 'ROL-01', rol: 'Admin',    activo: true  },
    { id_usuario: 2, nombre: 'María Operaciones',    email: 'maria@softyz.co',      fec_registro: '2024-02-10', id_rol: 'ROL-02', rol: 'Operador', activo: true  },
    { id_usuario: 3, nombre: 'Juan Bodeguero',       email: 'jbodega@softyz.co',    fec_registro: '2024-03-05', id_rol: 'ROL-02', rol: 'Operador', activo: true  },
    { id_usuario: 4, nombre: 'Ana Reportes',         email: 'areportes@softyz.co',  fec_registro: '2024-03-20', id_rol: 'ROL-03', rol: 'Visor',    activo: true  },
    { id_usuario: 5, nombre: 'Luis Inactivo',        email: 'linactivo@softyz.co',  fec_registro: '2024-04-01', id_rol: 'ROL-03', rol: 'Visor',    activo: false },
  ];

  private usuariosSubject = new BehaviorSubject<Usuario[]>(this.mockData);
  usuarios$ = this.usuariosSubject.asObservable();

  getAll(): Observable<Usuario[]> { return this.usuarios$; }

  getById(id: number) {
    return this.usuariosSubject.value.find(u => u.id_usuario === id);
  }

  getInitials(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  create(usuario: Omit<Usuario, 'id_usuario'>): void {
    const current = this.usuariosSubject.value;
    const newId = Math.max(...current.map(u => u.id_usuario), 0) + 1;
    this.usuariosSubject.next([...current, { ...usuario, id_usuario: newId }]);
  }

  update(id: number, changes: Partial<Usuario>): void {
    this.usuariosSubject.next(
      this.usuariosSubject.value.map(u => u.id_usuario === id ? { ...u, ...changes } : u)
    );
  }

  delete(id: number): void {
    this.usuariosSubject.next(this.usuariosSubject.value.filter(u => u.id_usuario !== id));
  }

  toggleActivo(id: number): void {
    this.usuariosSubject.next(
      this.usuariosSubject.value.map(u =>
        u.id_usuario === id ? { ...u, activo: !u.activo } : u
      )
    );
  }
}

@Injectable({ providedIn: 'root' })
export class RolService {

  private permisos: Permiso[] = [
    { id: 'PERM-01', nombre: 'leer',    descripcion: 'Ver listados y detalle de registros' },
    { id: 'PERM-02', nombre: 'crear',   descripcion: 'Crear nuevos registros en el sistema' },
    { id: 'PERM-03', nombre: 'editar',  descripcion: 'Modificar registros existentes' },
    { id: 'PERM-04', nombre: 'eliminar',descripcion: 'Eliminar registros del sistema' },
  ];

  private mockRoles: Rol[] = [
    {
      id: 'ROL-01', codigo: 'ROL-01', nombre: 'Admin',
      descripcion: 'Acceso total al sistema. Gestión de usuarios, roles y configuración.',
      permisos: ['leer', 'crear', 'editar', 'eliminar'],
      color: 'red', totalUsuarios: 1,
    },
    {
      id: 'ROL-02', codigo: 'ROL-02', nombre: 'Operador',
      descripcion: 'Gestión operativa: pedidos, inventario, envíos. Sin acceso a configuración.',
      permisos: ['leer', 'crear', 'editar'],
      color: 'blue', totalUsuarios: 2,
    },
    {
      id: 'ROL-03', codigo: 'ROL-03', nombre: 'Visor',
      descripcion: 'Solo lectura de todos los módulos del sistema.',
      permisos: ['leer'],
      color: 'green', totalUsuarios: 2,
    },
  ];

  private rolesSubject = new BehaviorSubject<Rol[]>(this.mockRoles);
  roles$ = this.rolesSubject.asObservable();

  getAll(): Observable<Rol[]> { return this.roles$; }
  getPermisos(): Permiso[] { return this.permisos; }

  getById(id: string): Rol | undefined {
    return this.rolesSubject.value.find(r => r.id === id);
  }

  create(rol: Omit<Rol, 'id'>): void {
    const current = this.rolesSubject.value;
    const num = current.length + 1;
    const id = `ROL-0${num + 3}`;
    this.rolesSubject.next([...current, { ...rol, id, codigo: id }]);
  }

  update(id: string, changes: Partial<Rol>): void {
    this.rolesSubject.next(
      this.rolesSubject.value.map(r => r.id === id ? { ...r, ...changes } : r)
    );
  }

  delete(id: string): void {
    this.rolesSubject.next(this.rolesSubject.value.filter(r => r.id !== id));
  }
}
