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
      nombre:         ['', [Validators.required, Validators.minLength(2)]],
      apellido:       ['', [Validators.required, Validators.minLength(2)]],
      rut:            ['', [Validators.required, Validators.minLength(7), Validators.maxLength(12)]],
      correo:         ['', [Validators.required, Validators.email]],
      clave:          ['', [Validators.required, Validators.minLength(6)]],
      confirmarClave: ['', Validators.required],
    }, { validators: passwordMatch });
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
