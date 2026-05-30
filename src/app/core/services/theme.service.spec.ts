import { TestBed } from '@angular/core/testing';
import { ThemeService, THEMES } from './theme.service';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;
  let httpTestingController: HttpTestingController;
  let authServiceSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      getCurrentUser: vi.fn().mockReturnValue({ userId: 'user-123' }),
    };

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(ThemeService);
    httpTestingController = TestBed.inject(HttpTestingController);

    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created and default to the first theme', () => {
    expect(service).toBeTruthy();
    expect(service.current).toEqual(THEMES[0]);
  });

  it('should load initial theme from localStorage if saved', () => {
    // Definimos un tema guardado
    const savedTheme = THEMES[1];
    localStorage.setItem('smartlogix-theme-user-123', savedTheme.id);

    // Creamos una nueva instancia del servicio para disparar el constructor
    const newService = new ThemeService('browser' as any, TestBed.inject(HttpClient), TestBed.inject(AuthService));
    expect(newService.current).toEqual(savedTheme);
  });

  describe('loadFromServer', () => {
    it('should retrieve preferences from API and apply theme if found', () => {
      service.loadFromServer();

      const req = httpTestingController.expectOne('/api/config/preferencias');
      expect(req.request.method).toBe('GET');
      req.flush({ tema: THEMES[2].id });

      expect(service.current).toEqual(THEMES[2]);
      expect(localStorage.getItem('smartlogix-theme-user-123')).toBe(THEMES[2].id);
    });

    it('should fall back and not change theme if server load fails', () => {
      const initialTheme = service.current;
      service.loadFromServer();

      const req = httpTestingController.expectOne('/api/config/preferencias');
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.current).toEqual(initialTheme);
    });
  });

  describe('apply', () => {
    it('should update current theme, save to localStorage, and call API PUT', () => {
      const targetTheme = THEMES[3];
      service.apply(targetTheme);

      expect(service.current).toEqual(targetTheme);
      expect(localStorage.getItem('smartlogix-theme-user-123')).toBe(targetTheme.id);

      const req = httpTestingController.expectOne('/api/config/preferencias/tema');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ valor: targetTheme.id });
      req.flush({});
    });
  });
});
