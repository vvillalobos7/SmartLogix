import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  const a = control.get('nuevaClave')?.value;
  const b = control.get('confirmar')?.value;
  return a && b && a !== b ? { noCoinciden: true } : null;
}

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
})
export class RecuperarComponent {
  paso: 1 | 2 | 3 = 1;
  correoValidado = '';
  rutValidado = '';

  solicitarForm: FormGroup;
  claveForm: FormGroup;

  loading = false;
  error = '';
  showNueva = false;
  showConfirmar = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.solicitarForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      rut:    ['', [Validators.required, Validators.minLength(7), Validators.maxLength(12)]],
    });

    this.claveForm = this.fb.group({
      nuevaClave: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/),
      ]],
      confirmar: ['', Validators.required],
    }, { validators: passwordMatch });
  }

  get passwordStrength(): number {
    const v: string = this.claveForm.get('nuevaClave')?.value ?? '';
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

  onSolicitar(): void {
    if (this.solicitarForm.invalid) return;
    this.loading = true;
    this.error = '';
    const correo = this.solicitarForm.value.correo as string;
    const rut    = this.solicitarForm.value.rut as string;
    this.authService.solicitarRecuperacion(correo).subscribe({
      next: () => {
        this.correoValidado = correo;
        this.rutValidado    = rut;
        this.loading = false;
        this.paso = 2;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo enviar la solicitud. Verifica tu correo e intenta nuevamente.';
        this.cdr.detectChanges();
      },
    });
  }

  onCambiarClave(): void {
    if (this.claveForm.invalid) return;
    this.loading = true;
    this.error = '';
    const { nuevaClave } = this.claveForm.value as { nuevaClave: string };
    this.authService.cambiarClave(this.correoValidado, this.rutValidado, nuevaClave).subscribe({
      next: () => {
        this.loading = false;
        this.paso = 3;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg: string = err?.error?.error ?? '';
        this.error = msg || 'No se pudo cambiar la contraseña. Verifica que tu solicitud haya sido aprobada por un administrador.';
        this.cdr.detectChanges();
      },
    });
  }
}
