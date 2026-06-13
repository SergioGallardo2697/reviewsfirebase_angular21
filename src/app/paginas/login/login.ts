import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AutenticacionService } from '../../core/servicios/autenticacion.service';

// Mapeo de códigos de error de Firebase a mensajes amigables para el usuario
const MENSAJES_ERROR: Record<string, string> = {
  'auth/user-not-found': 'No existe una cuenta con este correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-email': 'Correo electrónico inválido',
  'auth/invalid-credential': 'Credenciales inválidas',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/popup-closed-by-user': 'Se cerró la ventana de autenticación',
  'auth/usuario-no-autorizado': 'No tienes permiso para acceder a esta aplicación'
};

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly formulario = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', Validators.required]
  });

  readonly ocultarContrasena = signal(true);
  readonly cargando = signal(false);
  readonly error = signal('');

  async enviarFormulario() {
    if (this.formulario.invalid) {
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    const { email, contrasena } = this.formulario.getRawValue();
    await this.ejecutarLogin(() => this.autenticacionService.iniciarSesion(email, contrasena));
  }

  iniciarConGoogle() {
    return this.ejecutarLogin(() => this.autenticacionService.iniciarSesionConGoogle());
  }

  // Encapsula el flujo común de login: estado de carga, manejo de error y redirección
  private async ejecutarLogin(accion: () => Promise<unknown>) {
    this.cargando.set(true);
    this.error.set('');

    try {
      await accion();
      this.router.navigate(['/']);
    } catch (e) {
      this.error.set(this.traducirError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  private traducirError(error: unknown): string {
    let codigo = '';
    if (error instanceof FirebaseError) {
      codigo = error.code;
    } else if (error instanceof Error) {
      codigo = error.message;
    }
    return MENSAJES_ERROR[codigo] ?? 'Ocurrió un error inesperado';
  }
}
