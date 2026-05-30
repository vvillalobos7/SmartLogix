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

    // Limpiar localStorage antes de cada prueba
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
  });

  describe('hasRole', () => {
    it('should check if user has specific roles', () => {
      // Mock loguear un usuario
      (service as any).currentUserSubject.next({
        userId: '1',
        correo: 'admin@smartlogix.cl',
        rolNombre: 'admin',
      });

      expect(service.hasRole('admin')).toBe(true);
      expect(service.hasRole('bodeguero', 'admin')).toBe(true);
      expect(service.hasRole('bodeguero')).toBe(false);
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
  });

  describe('getInitials', () => {
    it('should return capital initials of emails', () => {
      expect(service.getInitials('john.doe@company.com')).toBe('JD');
      expect(service.getInitials('admin@smartlogix.cl')).toBe('A');
      expect(service.getInitials('john_doe')).toBe('JD');
    });
  });
});
