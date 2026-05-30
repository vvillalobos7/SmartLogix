import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RecuperarComponent } from './recuperar.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('RecuperarComponent', () => {
  let component: RecuperarComponent;
  let fixture: ComponentFixture<RecuperarComponent>;
  let authServiceSpy: any;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      validarIdentidad: vi.fn(),
      cambiarClave: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RecuperarComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecuperarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.paso).toBe(1);
  });

  it('should validate identity and move to step 2 if valid', () => {
    component.validarForm.setValue({ correo: 'test@smartlogix.cl', rut: '12345678-9' });
    authServiceSpy.validarIdentidad.mockReturnValue(of({ valido: true }));

    component.onValidar();

    expect(authServiceSpy.validarIdentidad).toHaveBeenCalledWith('test@smartlogix.cl', '12345678-9');
    expect(component.paso).toBe(2);
    expect(component.correoValidado).toBe('test@smartlogix.cl');
    expect(component.rutValidado).toBe('12345678-9');
  });

  it('should set error message if identity validation fails', () => {
    component.validarForm.setValue({ correo: 'test@smartlogix.cl', rut: '12345678-9' });
    authServiceSpy.validarIdentidad.mockReturnValue(of({ valido: false }));

    component.onValidar();

    expect(component.paso).toBe(1);
    expect(component.error).toContain('No se encontró una cuenta');
  });

  it('should validate password form and matching validator', () => {
    component.claveForm.patchValue({
      nuevaClave: '123456',
      confirmar: 'different'
    });
    expect(component.claveForm.valid).toBe(false);
    expect(component.claveForm.errors).toEqual({ noCoinciden: true });

    component.claveForm.patchValue({
      confirmar: '123456'
    });
    expect(component.claveForm.valid).toBe(true);
  });

  it('should submit password change and move to step 3', () => {
    component.correoValidado = 'test@smartlogix.cl';
    component.rutValidado = '12345678-9';
    component.claveForm.setValue({ nuevaClave: 'newpassword', confirmar: 'newpassword' });
    authServiceSpy.cambiarClave.mockReturnValue(of({ mensaje: 'ok' }));

    component.onCambiarClave();

    expect(authServiceSpy.cambiarClave).toHaveBeenCalledWith('test@smartlogix.cl', '12345678-9', 'newpassword');
    expect(component.paso).toBe(3);
  });
});
