import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const clave = control.get('clave')?.value;
  const confirmar = control.get('confirmarClave')?.value;
  return clave && confirmar && clave !== confirmar ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  form: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      nombre:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellido:       ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      rut:            ['', [Validators.required, Validators.minLength(7), Validators.maxLength(12)]],
      correo:         ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      clave:          ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/),
      ]],
      confirmarClave: ['', Validators.required],
    }, { validators: passwordMatch });
  }

  get passwordStrength(): number {
    const v: string = this.form.get('clave')?.value ?? '';
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(v)) score++;
    if (v.length >= 12) score++;
    return score;
  }

  get strengthLabel(): string {
    return ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][this.passwordStrength] ?? '';
  }

  get strengthColor(): string {
    return ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][this.passwordStrength] ?? '';
  }

  fieldClass(field: string): string {
    const c = this.form.get(field);
    if (!c?.touched) return 'border-gray-200 bg-gray-50';
    return c.invalid ? 'border-red-400 bg-red-50/30' : 'border-green-400 bg-green-50/30';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { confirmarClave, ...dto } = this.form.value;
    this.authService.registrar(dto).subscribe({
      next: () => {
        // Auto-login inmediato con las mismas credenciales
        this.authService.login({ correo: dto.correo, clave: dto.clave }).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => {
            // Registro OK pero login falló — llevar al login manual
            this.loading = false;
            this.router.navigate(['/login']);
          },
        });
      },
      error: () => {
        this.error = 'No se pudo completar el registro. Intenta nuevamente.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
