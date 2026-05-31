import { TestBed } from '@angular/core/testing';
import { UsuarioService, RolService } from './usuario.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Usuario, Rol } from '../../shared/models/models';
import { firstValueFrom } from 'rxjs';

describe('UsuarioService (Feature)', () => {
  let service: UsuarioService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsuarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UsuarioService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get all users via API', async () => {
    const mockUsers: Usuario[] = [
      { id: '1', nombre: 'Carlos', correo: 'carlos@test.com', activo: true },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.usuarios);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);

    const users = await promise;
    expect(users).toEqual(mockUsers);
    expect(service.getSnapshot()).toEqual(mockUsers);
  });

  it('should fall back to mock data when API fails on getAll', async () => {
    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.usuarios);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    const users = await promise;
    expect(users.length).toBe(5); // mockData length
  });

  it('should get user by id', async () => {
    const mockUser: Usuario = { id: 'uuid-admin-001', nombre: 'Carlos', correo: 'admin@smartlogix.cl', activo: true };

    const promise = firstValueFrom(service.getById('uuid-admin-001'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001`);
    req.flush(mockUser);

    const user = await promise;
    expect(user).toEqual(mockUser);
  });

  it('should fallback to mock user when getById fails', async () => {
    const promise = firstValueFrom(service.getById('uuid-admin-001'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const user = await promise;
    expect(user.nombre).toBe('Carlos');
  });

  it('should get user by email', async () => {
    const mockUser: Usuario = { id: '1', nombre: 'Carlos', correo: 'carlos@test.com', activo: true };

    const promise = firstValueFrom(service.getByCorreo('carlos@test.com'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/correo/carlos@test.com`);
    req.flush(mockUser);

    const user = await promise;
    expect(user).toEqual(mockUser);
  });

  it('should create user and update subject', async () => {
    const dto = { nombre: 'New', correo: 'new@test.com' };
    const mockCreated = { id: '123', nombre: 'New', correo: 'new@test.com', activo: true };

    const promise = firstValueFrom(service.create(dto));
    const req = httpTestingController.expectOne(environment.services.usuarios);
    expect(req.request.method).toBe('POST');
    req.flush(mockCreated);

    const user = await promise;
    expect(user.id).toBe('123');
  });

  it('should fallback to mock creation when create fails', async () => {
    const dto = { nombre: 'MockCreated', correo: 'mock@test.com' };
    
    const promise = firstValueFrom(service.create(dto));
    const req = httpTestingController.expectOne(environment.services.usuarios);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const user = await promise;
    expect(user.nombre).toBe('MockCreated');
    expect(user.id).toContain('uuid-');
  });

  it('should update user via API', async () => {
    const mockUpdated = { id: 'uuid-admin-001', nombre: 'CarlosUpdated', correo: 'admin@smartlogix.cl', activo: true };

    const promise = firstValueFrom(service.update('uuid-admin-001', { nombre: 'CarlosUpdated' }));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockUpdated);

    const user = await promise;
    expect(user.nombre).toBe('CarlosUpdated');
  });

  it('should fallback to local update when update fails', async () => {
    const promise = firstValueFrom(service.update('uuid-admin-001', { nombre: 'CarlosLocalUpdate' }));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const user = await promise;
    expect(user.nombre).toBe('CarlosLocalUpdate');
  });

  it('should delete user via API', async () => {
    const promise = firstValueFrom(service.delete('uuid-admin-001'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await promise;
  });

  it('should fallback to local delete when delete fails', async () => {
    const promise = firstValueFrom(service.delete('uuid-admin-001'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    await promise;
  });

  it('should toggle active status of user', async () => {
    const mockUpdated = { id: 'uuid-admin-001', nombre: 'Carlos', correo: 'admin@smartlogix.cl', activo: false };

    const promise = firstValueFrom(service.toggleActivo('uuid-admin-001'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001/toggle-activo`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockUpdated);

    const user = await promise;
    expect(user.activo).toBe(false);
  });

  it('should fallback to local toggle when toggleActivo fails', async () => {
    const promise = firstValueFrom(service.toggleActivo('uuid-admin-001'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001/toggle-activo`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const user = await promise;
    // Carlos was active: true, fallback should invert it to false
    expect(user.activo).toBe(false);
  });

  it('should assign a role to a user', async () => {
    const mockUpdated = { id: 'uuid-admin-001', nombre: 'Carlos', correo: 'admin@smartlogix.cl', rolNombre: 'bodeguero' };

    const promise = firstValueFrom(service.asignarRol('uuid-admin-001', 'rol-bodeguero', 'bodeguero'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001/asignar-rol`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rolId: 'rol-bodeguero', rolNombre: 'bodeguero' });
    req.flush(mockUpdated);

    const user = await promise;
    expect(user.rolNombre).toBe('bodeguero');
  });

  it('should fallback to local role assignment when asignarRol fails', async () => {
    const promise = firstValueFrom(service.asignarRol('uuid-admin-001', 'rol-bodeguero', 'bodeguero'));
    const req = httpTestingController.expectOne(`${environment.services.usuarios}/uuid-admin-001/asignar-rol`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const user = await promise;
    expect(user.rolNombre).toBe('bodeguero');
  });

  it('should get initials of name', () => {
    expect(service.getInitials('John Doe')).toBe('JD');
  });
});

describe('RolService (Feature)', () => {
  let service: RolService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RolService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(RolService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get all roles via API', async () => {
    const mockRoles: Rol[] = [
      { id: '1', nombre: 'admin' },
    ];

    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.roles);
    expect(req.request.method).toBe('GET');
    req.flush(mockRoles);

    const roles = await promise;
    expect(roles).toEqual(mockRoles);
  });

  it('should fallback to mock roles when getAll fails', async () => {
    const promise = firstValueFrom(service.getAll());
    const req = httpTestingController.expectOne(environment.services.roles);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const roles = await promise;
    expect(roles.length).toBe(4); // mockRoles count
  });

  it('should get role by id', () => {
    const role = service.getById('rol-admin');
    expect(role?.nombre).toBe('admin');
  });

  it('should create role via API', async () => {
    const dto = { nombre: 'custom', descripcion: 'desc' };
    const mockCreated = { id: 'rol-123', nombre: 'custom', descripcion: 'desc' };

    const promise = firstValueFrom(service.create(dto));
    const req = httpTestingController.expectOne(environment.services.roles);
    expect(req.request.method).toBe('POST');
    req.flush(mockCreated);

    const role = await promise;
    expect(role.id).toBe('rol-123');
  });

  it('should fallback to mock creation when create fails', async () => {
    const dto = { nombre: 'custom', descripcion: 'desc' };

    const promise = firstValueFrom(service.create(dto));
    const req = httpTestingController.expectOne(environment.services.roles);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const role = await promise;
    expect(role.nombre).toBe('custom');
    expect(role.id).toContain('rol-');
  });

  it('should update role via API', async () => {
    const mockUpdated = { id: 'rol-admin', nombre: 'admin', descripcion: 'Updated desc' };

    const promise = firstValueFrom(service.update('rol-admin', { descripcion: 'Updated desc' }));
    const req = httpTestingController.expectOne(`${environment.services.roles}/rol-admin`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockUpdated);

    const role = await promise;
    expect(role.descripcion).toBe('Updated desc');
  });

  it('should fallback to local update when update fails', async () => {
    const promise = firstValueFrom(service.update('rol-admin', { descripcion: 'LocalUpdated' }));
    const req = httpTestingController.expectOne(`${environment.services.roles}/rol-admin`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    const role = await promise;
    expect(role.descripcion).toBe('LocalUpdated');
  });

  it('should delete role via API', async () => {
    const promise = firstValueFrom(service.delete('rol-admin'));
    const req = httpTestingController.expectOne(`${environment.services.roles}/rol-admin`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await promise;
  });

  it('should fallback to local delete when delete fails', async () => {
    const promise = firstValueFrom(service.delete('rol-admin'));
    const req = httpTestingController.expectOne(`${environment.services.roles}/rol-admin`);
    req.flush('Error', { status: 500, statusText: 'Error' });

    await promise;
  });
});
