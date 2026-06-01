import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  let routerSpy: any;
  let toastSpy: any;

  beforeEach(() => {
    routerSpy = { navigate: vi.fn() };
    toastSpy = { warning: vi.fn(), success: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should authenticate successfully with API and store user token/session', () => {
      const credentials = { correo: 'test@smartlogix.cl', clave: 'password' };
      const apiResponse = {
        token: 'real-jwt-token',
        tipo: 'Bearer',
        userId: '123',
        correo: 'test@smartlogix.cl',
        rolNombre: 'admin' as const,
      };

      service.login(credentials).subscribe((res) => {
        expect(res).toEqual(apiResponse);
        expect(service.isLoggedIn()).toBe(true);
        expect(service.getToken()).toBe('real-jwt-token');
        expect(service.getCurrentUser()).toEqual({
          userId: '123',
          correo: 'test@smartlogix.cl',
          rolNombre: 'admin',
        });
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(apiResponse);
    });

    it('should fall back to offline mode for preconfigured mock users if API fails', () => {
      const credentials = { correo: 'admin@smartlogix.cl', clave: 'admin123' };

      service.login(credentials).subscribe((res) => {
        expect(res.token).toBe('mock-token-admin');
        expect(service.isLoggedIn()).toBe(true);
        expect(service.isMockSession()).toBe(true);
        expect(toastSpy.warning).toHaveBeenCalled();
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Error de conexión', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should propagate API error if login fails and user is not a mock user', () => {
      const credentials = { correo: 'unknown@smartlogix.cl', clave: 'wrong' };

      service.login(credentials).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('No autorizado', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle bodeguero mock user login', () => {
      const credentials = { correo: 'bodeguero@smartlogix.cl', clave: 'bodega123' };

      service.login(credentials).subscribe((res) => {
        expect(res.token).toBe('mock-token-bodeguero');
        expect(res.rolNombre).toBe('bodeguero');
        expect(service.getCurrentUser()?.rolNombre).toBe('bodeguero');
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle transportista mock user login', () => {
      const credentials = { correo: 'transportista@smartlogix.cl', clave: 'trans123' };

      service.login(credentials).subscribe((res) => {
        expect(res.token).toBe('mock-token-transportista');
        expect(res.rolNombre).toBe('transportista');
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle cliente mock user login', () => {
      const credentials = { correo: 'cliente@smartlogix.cl', clave: 'cliente123' };

      service.login(credentials).subscribe((res) => {
        expect(res.token).toBe('mock-token-cliente');
        expect(res.rolNombre).toBe('cliente');
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should reject login with incorrect mock user password', () => {
      const credentials = { correo: 'admin@smartlogix.cl', clave: 'wrongpassword' };

      service.login(credentials).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle 403 Forbidden error', () => {
      const credentials = { correo: 'test@smartlogix.cl', clave: 'password' };

      service.login(credentials).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(403);
        },
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 Not Found error', () => {
      const credentials = { correo: 'test@smartlogix.cl', clave: 'password' };

      service.login(credentials).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should store token in localStorage upon successful login', () => {
      const credentials = { correo: 'test@smartlogix.cl', clave: 'password' };
      const apiResponse = {
        token: 'test-token-123',
        tipo: 'Bearer',
        userId: '456',
        correo: 'test@smartlogix.cl',
        rolNombre: 'admin' as const,
      };

      service.login(credentials).subscribe();

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush(apiResponse);

      expect(localStorage.getItem('smartlogix_token')).toBe('test-token-123');
    });

    it('should store user in localStorage upon successful login', () => {
      const credentials = { correo: 'test@smartlogix.cl', clave: 'password' };
      const apiResponse = {
        token: 'test-token-123',
        tipo: 'Bearer',
        userId: '789',
        correo: 'test@smartlogix.cl',
        rolNombre: 'bodeguero' as const,
      };

      service.login(credentials).subscribe();

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush(apiResponse);

      const user = JSON.parse(localStorage.getItem('smartlogix_user') || '{}');
      expect(user.userId).toBe('789');
      expect(user.correo).toBe('test@smartlogix.cl');
      expect(user.rolNombre).toBe('bodeguero');
    });

    it('should emit currentUser$ observable on login', () => {
      const credentials = { correo: 'test@smartlogix.cl', clave: 'password' };
      const apiResponse = {
        token: 'test-token',
        tipo: 'Bearer',
        userId: '111',
        correo: 'test@smartlogix.cl',
        rolNombre: 'admin' as const,
      };

      let emissions = 0;
      const sub = service.currentUser$.subscribe((user) => {
        if (user && user.userId === '111') {
          emissions++;
        }
      });

      service.login(credentials).subscribe();

      const req = httpTestingController.expectOne(`${environment.services.auth}/login`);
      req.flush(apiResponse);

      sub.unsubscribe();
      expect(emissions).toBeGreaterThan(0);
    });
  });

  describe('logout', () => {
    it('should clear stored session/token and navigate to login', () => {
      localStorage.setItem('smartlogix_token', 'some-token');
      localStorage.setItem('smartlogix_user', JSON.stringify({ userId: '1', correo: 'a@a.com' }));
      service.isLoggedIn.set(true);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear localStorage token on logout', () => {
      localStorage.setItem('smartlogix_token', 'test-token');
      service.isLoggedIn.set(true);

      service.logout();

      expect(localStorage.getItem('smartlogix_token')).toBeNull();
    });

    it('should clear localStorage user on logout', () => {
      localStorage.setItem('smartlogix_user', JSON.stringify({ userId: '1' }));
      service.isLoggedIn.set(true);

      service.logout();

      expect(localStorage.getItem('smartlogix_user')).toBeNull();
    });

    it('should emit null in currentUser$ on logout', () => {
      (service as any).currentUserSubject.next({ userId: '1', correo: 'a@a.com', rolNombre: 'admin' });

      const emittedUsers: any[] = [];
      const sub = service.currentUser$.subscribe((user) => {
        emittedUsers.push(user);
      });

      service.logout();
      sub.unsubscribe();

      expect(emittedUsers).toEqual([
        { userId: '1', correo: 'a@a.com', rolNombre: 'admin' },
        null
      ]);
    });
  });

  describe('hasRole', () => {
    it('should check if user has specific roles', () => {
      (service as any).currentUserSubject.next({
        userId: '1',
        correo: 'admin@smartlogix.cl',
        rolNombre: 'admin',
      });

      expect(service.hasRole('admin')).toBe(true);
      expect(service.hasRole('bodeguero', 'admin')).toBe(true);
      expect(service.hasRole('bodeguero')).toBe(false);
    });

    it('should return false if no user is logged in', () => {
      (service as any).currentUserSubject.next(null);

      expect(service.hasRole('admin')).toBe(false);
      expect(service.hasRole('bodeguero')).toBe(false);
    });

    it('should check multiple roles with OR logic', () => {
      (service as any).currentUserSubject.next({
        userId: '1',
        correo: 'bodeguero@smartlogix.cl',
        rolNombre: 'bodeguero',
      });

      expect(service.hasRole('admin', 'bodeguero', 'transportista')).toBe(true);
      expect(service.hasRole('admin', 'transportista')).toBe(false);
    });

    it('should handle transportista role', () => {
      (service as any).currentUserSubject.next({
        userId: '1',
        correo: 'transportista@smartlogix.cl',
        rolNombre: 'transportista',
      });

      expect(service.hasRole('transportista')).toBe(true);
    });

    it('should handle cliente role', () => {
      (service as any).currentUserSubject.next({
        userId: '1',
        correo: 'cliente@smartlogix.cl',
        rolNombre: 'cliente',
      });

      expect(service.hasRole('cliente')).toBe(true);
    });
  });

  describe('validarIdentidad', () => {
    it('should send validation request and return validity', () => {
      const mockResult = { valido: true };
      service.validarIdentidad('a@a.com', '12345678-9').subscribe((res) => {
        expect(res.valido).toBe(true);
      });

      const req = httpTestingController.expectOne(`${environment.services.recuperar}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResult);
    });

    it('should return false on API error for validarIdentidad', () => {
      service.validarIdentidad('test@test.com', '99999999-9').subscribe((res) => {
        expect(res.valido).toBe(false);
      });

      const req = httpTestingController.expectOne(`${environment.services.recuperar}`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle validation with valid rut', () => {
      const mockResult = { valido: true };
      service.validarIdentidad('admin@smartlogix.cl', '11111111-1').subscribe((res) => {
        expect(res.valido).toBe(true);
      });

      const req = httpTestingController.expectOne(`${environment.services.recuperar}`);
      req.flush(mockResult);
    });

    it('should handle validation with invalid rut', () => {
      const mockResult = { valido: false };
      service.validarIdentidad('admin@smartlogix.cl', 'invalid-rut').subscribe((res) => {
        expect(res.valido).toBe(false);
      });

      const req = httpTestingController.expectOne(`${environment.services.recuperar}`);
      req.flush(mockResult);
    });

    it('should handle 404 error from validarIdentidad', () => {
      service.validarIdentidad('notfound@test.com', '99999999-9').subscribe((res) => {
        expect(res.valido).toBe(false);
      });

      const req = httpTestingController.expectOne(`${environment.services.recuperar}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('cambiarClave', () => {
    it('should send password change request', () => {
      const mockResult = { mensaje: 'Contraseña actualizada' };
      service.cambiarClave('admin@smartlogix.cl', '11111111-1', 'newpassword').subscribe((res) => {
        expect(res.mensaje).toBeDefined();
      });

      const req = httpTestingController.expectOne('/auth/cambiar-clave');
      expect(req.request.method).toBe('POST');
      req.flush(mockResult);
    });

    it('should return error message on password change failure', () => {
      service.cambiarClave('admin@smartlogix.cl', '11111111-1', 'newpassword').subscribe((res) => {
        expect(res.mensaje).toContain('No se pudo actualizar');
      });

      const req = httpTestingController.expectOne('/auth/cambiar-clave');
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle 400 Bad Request on password change', () => {
      service.cambiarClave('admin@smartlogix.cl', 'invalid-rut', 'newpass').subscribe((res) => {
        expect(res.mensaje).toContain('No se pudo actualizar');
      });

      const req = httpTestingController.expectOne('/auth/cambiar-clave');
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('registrar', () => {
    it('should send registration request', () => {
      const dto = { correo: 'newuser@test.com', nombre: 'Test User' } as any;

      service.registrar(dto).subscribe((res) => {
        expect(res).toBeDefined();
      });

      const req = httpTestingController.expectOne(`${environment.services.registro}`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('should propagate error on registration failure', () => {
      const dto = { correo: 'newuser@test.com', nombre: 'Test User' } as any;

      service.registrar(dto).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpTestingController.expectOne(`${environment.services.registro}`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle duplicate user registration error', () => {
      const dto = { correo: 'duplicate@test.com', nombre: 'Duplicate User' } as any;

      service.registrar(dto).subscribe({
        next: () => expect.fail('should have failed'),
        error: (err) => {
          expect(err.status).toBe(409);
        },
      });

      const req = httpTestingController.expectOne(`${environment.services.registro}`);
      req.flush('Conflict', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('getToken', () => {
    it('should retrieve token from localStorage', () => {
      localStorage.setItem('smartlogix_token', 'test-token-123');

      const token = service.getToken();
      expect(token).toBe('test-token-123');
    });

    it('should return null if no token exists', () => {
      localStorage.clear();

      const token = service.getToken();
      expect(token).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = { userId: '1', correo: 'test@test.com', rolNombre: 'admin' as const };
      (service as any).currentUserSubject.next(mockUser);

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null if no user is logged in', () => {
      (service as any).currentUserSubject.next(null);

      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('isMockSession', () => {
    it('should return true for mock token', () => {
      localStorage.setItem('smartlogix_token', 'mock-token-admin');

      expect(service.isMockSession()).toBe(true);
    });

    it('should return false for real token', () => {
      localStorage.setItem('smartlogix_token', 'real-jwt-token-xyz');

      expect(service.isMockSession()).toBe(false);
    });

    it('should return false if no token exists', () => {
      localStorage.clear();

      expect(service.isMockSession()).toBe(false);
    });
  });

  describe('getInitials', () => {
    it('should return capital initials of emails', () => {
      expect(service.getInitials('john.doe@company.com')).toBe('JD');
      expect(service.getInitials('admin@smartlogix.cl')).toBe('A');
      expect(service.getInitials('john_doe')).toBe('JD');
    });

    it('should handle single character names', () => {
      expect(service.getInitials('a@company.com')).toBe('A');
    });

    it('should handle multiple separators', () => {
      expect(service.getInitials('john.paul.smith@company.com')).toBe('JP');
      expect(service.getInitials('john-paul_smith')).toBe('JP');
    });

    it('should handle names without domain', () => {
      expect(service.getInitials('john')).toBe('J');
      expect(service.getInitials('johnpaul')).toBe('J');
    });

    it('should convert to uppercase', () => {
      expect(service.getInitials('john.doe@company.com')).toBe('JD');
      expect(service.getInitials('JOHN.DOE@COMPANY.COM')).toBe('JD');
    });

    it('should handle empty string', () => {
      expect(service.getInitials('')).toBe('');
    });

    it('should handle spaces as separators', () => {
      expect(service.getInitials('john doe')).toBe('JD');
    });
  });
});
