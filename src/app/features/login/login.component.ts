import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChallengeResponse } from '../../shared/models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  // Paso 1: credenciales
  form: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  // Paso 2: desafío 2FA
  paso: 'credenciales' | 'challenge' = 'credenciales';
  challengeToken = '';
  pregunta = '';
  challengeForm: FormGroup;
  loadingChallenge = false;
  errorChallenge = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      clave:  ['', [Validators.required, Validators.minLength(6)]],
    });
    this.challengeForm = this.fb.group({
      respuesta: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    this.authService.login(this.form.value).subscribe({
      next: (response) => {
        const challenge = response as ChallengeResponse;
        if (challenge.status === 'CHALLENGE') {
          this.challengeToken = challenge.challengeToken;
          this.pregunta = challenge.pregunta;
          this.paso = 'challenge';
          this.loading = false;
          this.cdr.detectChanges();
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.errorMsg = err?.status === 429
          ? 'Demasiados intentos. Espera 1 minuto e intenta de nuevo.'
          : 'Credenciales inválidas. Verifica tu correo y contraseña.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSubmitChallenge(): void {
    if (this.challengeForm.invalid) return;
    this.loadingChallenge = true;
    this.errorChallenge = '';
    const respuesta = this.challengeForm.value.respuesta as string;
    this.authService.verificarPregunta(this.challengeToken, respuesta).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorChallenge = 'Respuesta incorrecta. Intenta de nuevo.';
        this.loadingChallenge = false;
        this.challengeForm.reset();
        this.cdr.detectChanges();
      },
    });
  }

  volverACredenciales(): void {
    this.paso = 'credenciales';
    this.challengeToken = '';
    this.pregunta = '';
    this.errorChallenge = '';
    this.challengeForm.reset();
  }
}
