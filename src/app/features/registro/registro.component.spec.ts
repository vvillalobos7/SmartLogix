import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RegistroComponent } from './registro.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('RegistroComponent', () => {
  let component: RegistroComponent;
  let fixture: ComponentFixture<RegistroComponent>;
  let authServiceSpy: any;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      registrar: vi.fn(),
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegistroComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form and password matches', () => {
    component.form.patchValue({
      nombre: 'John',
      apellido: 'Doe',
      rut: '12345678-9',
      correo: 'john@doe.com',
      clave: '123456',
      confirmarClave: 'different'
    });

    expect(component.form.valid).toBe(false);
    expect(component.form.errors).toEqual({ noCoinciden: true });

    component.form.patchValue({
      confirmarClave: '123456'
    });
    expect(component.form.valid).toBe(true);
  });

  it('should register and auto-login successfully', () => {
    component.form.setValue({
      nombre: 'John',
      apellido: 'Doe',
      rut: '12345678-9',
      correo: 'john@doe.com',
      clave: '123456',
      confirmarClave: '123456'
    });

    authServiceSpy.registrar.mockReturnValue(of({}));
    authServiceSpy.login.mockReturnValue(of({ token: 'mock-token' }));

    component.onSubmit();

    expect(authServiceSpy.registrar).toHaveBeenCalledWith({
      nombre: 'John',
      apellido: 'Doe',
      rut: '12345678-9',
      correo: 'john@doe.com',
      clave: '123456'
    });
    expect(authServiceSpy.login).toHaveBeenCalledWith({
      correo: 'john@doe.com',
      clave: '123456'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect to login if registration succeeds but auto-login fails', () => {
    component.form.setValue({
      nombre: 'John',
      apellido: 'Doe',
      rut: '12345678-9',
      correo: 'john@doe.com',
      clave: '123456',
      confirmarClave: '123456'
    });

    authServiceSpy.registrar.mockReturnValue(of({}));
    authServiceSpy.login.mockReturnValue(throwError(() => new Error('Login failed')));

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.loading).toBe(false);
  });

  it('should set error message if registration fails', () => {
    component.form.setValue({
      nombre: 'John',
      apellido: 'Doe',
      rut: '12345678-9',
      correo: 'john@doe.com',
      clave: '123456',
      confirmarClave: '123456'
    });

    authServiceSpy.registrar.mockReturnValue(throwError(() => new Error('Registration failed')));

    component.onSubmit();

    expect(component.error).toContain('No se pudo completar el registro');
    expect(component.loading).toBe(false);
  });
});
