import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: any;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = {
      isLoggedIn: vi.fn().mockReturnValue(false),
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard on init if already logged in', () => {
    authServiceSpy.isLoggedIn.mockReturnValue(true);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should validate form fields', () => {
    const emailControl = component.form.get('correo');
    const passwordControl = component.form.get('clave');

    emailControl?.setValue('');
    passwordControl?.setValue('');
    expect(component.form.valid).toBe(false);

    emailControl?.setValue('invalidemail');
    passwordControl?.setValue('123'); // too short
    expect(component.form.valid).toBe(false);

    emailControl?.setValue('test@smartlogix.cl');
    passwordControl?.setValue('123456');
    expect(component.form.valid).toBe(true);
  });

  it('should call login and redirect on successful submit', () => {
    component.form.setValue({ correo: 'test@smartlogix.cl', clave: '123456' });
    authServiceSpy.login.mockReturnValue(of({ token: 'mock-token' }));

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      correo: 'test@smartlogix.cl',
      clave: '123456'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading).toBe(true);
  });

  it('should show error message when login fails with 429', () => {
    component.form.setValue({ correo: 'test@smartlogix.cl', clave: '123456' });
    authServiceSpy.login.mockReturnValue(throwError(() => ({ status: 429 })));

    component.onSubmit();

    expect(component.errorMsg).toContain('Demasiados intentos');
    expect(component.loading).toBe(false);
  });

  it('should show generic error message when login fails with other status', () => {
    component.form.setValue({ correo: 'test@smartlogix.cl', clave: '123456' });
    authServiceSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));

    component.onSubmit();

    expect(component.errorMsg).toContain('Credenciales inválidas');
    expect(component.loading).toBe(false);
  });
});
