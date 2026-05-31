import { TestBed } from '@angular/core/testing';
import { UsuarioService, RolService } from './usuario.service';
import { Usuario, Rol } from '../interfaces/models';
import { firstValueFrom } from 'rxjs';

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService],
    });
    service = TestBed.inject(UsuarioService);
  });

  it('should be created and return initial users', async () => {
    expect(service).toBeTruthy();
    const usuarios = await firstValueFrom(service.getAll());
    expect(usuarios.length).toBe(5);
  });

  it('should find user by id', () => {
    const user = service.getById(1);
    expect(user).toBeDefined();
    expect(user?.nombre).toBe('Carlos Administrador');
  });

  it('should get initials of a name', () => {
    expect(service.getInitials('John Doe')).toBe('JD');
    expect(service.getInitials('Carlos Administrador')).toBe('CA');
  });

  it('should create a new user', async () => {
    const newUser: Omit<Usuario, 'id_usuario'> = {
      nombre: 'Pedro Test',
      email: 'pedro@test.com',
      fec_registro: '2025-04-20',
      id_rol: 'ROL-02',
      rol: 'Operador',
      activo: true
    };

    service.create(newUser);

    const users = await firstValueFrom(service.getAll());
    const created = users.find(u => u.email === 'pedro@test.com');
    expect(created).toBeDefined();
    expect(created?.id_usuario).toBe(6);
  });

  it('should update user properties', async () => {
    service.update(1, { nombre: 'Carlos Modificado' });

    const users = await firstValueFrom(service.getAll());
    const updated = users.find(u => u.id_usuario === 1);
    expect(updated?.nombre).toBe('Carlos Modificado');
  });

  it('should toggle active status of a user', async () => {
    // Carlos is initially active: true
    service.toggleActivo(1);

    const users = await firstValueFrom(service.getAll());
    const updated = users.find(u => u.id_usuario === 1);
    expect(updated?.activo).toBe(false);
  });

  it('should delete a user', async () => {
    service.delete(1);

    const users = await firstValueFrom(service.getAll());
    const deleted = users.find(u => u.id_usuario === 1);
    expect(deleted).toBeUndefined();
    expect(users.length).toBe(4);
  });
});

describe('RolService', () => {
  let service: RolService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RolService],
    });
    service = TestBed.inject(RolService);
  });

  it('should be created and return initial roles and permissions', async () => {
    expect(service).toBeTruthy();
    expect(service.getPermisos().length).toBe(4);
    
    const roles = await firstValueFrom(service.getAll());
    expect(roles.length).toBe(3);
  });

  it('should find a role by id', () => {
    const role = service.getById('ROL-01');
    expect(role).toBeDefined();
    expect(role?.nombre).toBe('Admin');
  });

  it('should create a new role', async () => {
    const newRole: Omit<Rol, 'id'> = {
      codigo: '',
      nombre: 'Custom Rol',
      descripcion: 'Custom',
      permisos: ['leer'],
      color: 'purple',
      totalUsuarios: 0
    };

    service.create(newRole);

    const roles = await firstValueFrom(service.getAll());
    const created = roles.find(r => r.nombre === 'Custom Rol');
    expect(created).toBeDefined();
    expect(created?.id).toContain('ROL-');
  });

  it('should update role properties', async () => {
    service.update('ROL-01', { nombre: 'SuperAdmin' });

    const roles = await firstValueFrom(service.getAll());
    const updated = roles.find(r => r.id === 'ROL-01');
    expect(updated?.nombre).toBe('SuperAdmin');
  });

  it('should delete a role', async () => {
    service.delete('ROL-01');

    const roles = await firstValueFrom(service.getAll());
    const deleted = roles.find(r => r.id === 'ROL-01');
    expect(deleted).toBeUndefined();
    expect(roles.length).toBe(2);
  });
});
