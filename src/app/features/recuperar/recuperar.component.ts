import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar.component.html',
})
export class RecuperarComponent {
  form: FormGroup;
  loading = false;
  mensaje = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      rut:    ['', [Validators.required, Validators.minLength(7), Validators.maxLength(12)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.mensaje = '';
    const { correo, rut } = this.form.value;
    this.authService.recuperarClave(correo, rut).subscribe({
      next: (res) => {
        this.mensaje = res.mensaje;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo procesar la solicitud. Verifica los datos ingresados.';
        this.loading = false;
      },
    });
  }
}
