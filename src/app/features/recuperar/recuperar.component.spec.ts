import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RecuperarComponent } from './recuperar.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('RecuperarComponent', () => {
  let component: RecuperarComponent;
  let fixture: ComponentFixture<RecuperarComponent>;
  let authServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      solicitarRecuperacion: vi.fn(),
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
    fixture.detectChanges();
  });

  it('should create at paso 1', () => {
    expect(component).toBeTruthy();
    expect(component.paso).toBe(1);
  });

  it('should move to paso 2 on successful solicitud', () => {
    component.solicitarForm.setValue({ correo: 'test@smartlogix.cl' });
    authServiceSpy.solicitarRecuperacion.mockReturnValue(of({ mensaje: 'ok' }));

    component.onSolicitar();

    expect(authServiceSpy.solicitarRecuperacion).toHaveBeenCalledWith('test@smartlogix.cl');
    expect(component.paso).toBe(2);
    expect(component.correoValidado).toBe('test@smartlogix.cl');
  });

  it('should show error if solicitud fails', () => {
    component.solicitarForm.setValue({ correo: 'test@smartlogix.cl' });
    authServiceSpy.solicitarRecuperacion.mockReturnValue(throwError(() => new Error('error')));

    component.onSolicitar();

    expect(component.paso).toBe(1);
    expect(component.error).toBeTruthy();
  });

  it('should validate password form matching', () => {
    component.claveForm.patchValue({ nuevaClave: 'Abcdefg1!', confirmar: 'diferente' });
    expect(component.claveForm.valid).toBe(false);
    expect(component.claveForm.errors).toEqual({ noCoinciden: true });

    component.claveForm.patchValue({ confirmar: 'Abcdefg1!' });
    expect(component.claveForm.valid).toBe(true);
  });

  it('should submit password change and move to paso 3', () => {
    component.correoValidado = 'test@smartlogix.cl';
    component.claveForm.setValue({ nuevaClave: 'Abcdefg1!', confirmar: 'Abcdefg1!' });
    authServiceSpy.cambiarClave.mockReturnValue(of({ mensaje: 'ok' }));

    component.onCambiarClave();

    expect(authServiceSpy.cambiarClave).toHaveBeenCalledWith('test@smartlogix.cl', 'Abcdefg1!');
    expect(component.paso).toBe(3);
  });

  it('should show backend error message on cambiarClave failure', () => {
    component.correoValidado = 'test@smartlogix.cl';
    component.claveForm.setValue({ nuevaClave: 'Abcdefg1!', confirmar: 'Abcdefg1!' });
    authServiceSpy.cambiarClave.mockReturnValue(
      throwError(() => ({ error: { error: 'No tienes solicitud aprobada.' } })),
    );

    component.onCambiarClave();

    expect(component.error).toBe('No tienes solicitud aprobada.');
    expect(component.paso).toBe(2);
  });
});
