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
  correoEnviado = '';

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
    });

    this.claveForm = this.fb.group({
      correo:     ['', [Validators.required, Validators.email]],
      rut:        ['', [Validators.required, Validators.minLength(7), Validators.maxLength(12)]],
      nuevaClave: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).*$/),
      ]],
      confirmar: ['', Validators.required],
    }, { validators: passwordMatch });
  }

  onSolicitar(): void {
    if (this.solicitarForm.invalid) return;
    this.loading = true;
    this.error = '';
    const correo = this.solicitarForm.value.correo as string;
    this.authService.solicitarRecuperacion(correo).subscribe({
      next: () => {
        this.correoEnviado = correo;
        this.claveForm.patchValue({ correo });
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
    const { correo, rut, nuevaClave } = this.claveForm.value as { correo: string; rut: string; nuevaClave: string };
    this.authService.cambiarClave(correo, rut, nuevaClave).subscribe({
      next: () => {
        this.loading = false;
        this.paso = 3;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cambiar la contraseña. Verifica que tu solicitud haya sido aprobada por un administrador.';
        this.cdr.detectChanges();
      },
    });
  }
}
