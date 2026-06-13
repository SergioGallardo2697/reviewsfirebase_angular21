import { Injectable, signal } from '@angular/core';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase.config';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  // Estado público observable mediante signals
  readonly usuarioActual = signal<User | null>(null);
  readonly cargando = signal(true);
  readonly errorRedireccion = signal('');

  // Promesa que se resuelve cuando Firebase termina la primera comprobación de sesión.
  // Permite a los guards esperar sin polling.
  private resolverInicializacion!: () => void;
  readonly inicializado = new Promise<void>(resolver => {
    this.resolverInicializacion = resolver;
  });

  constructor() {
    // Suscripción al estado de autenticación de Firebase (solo una vez en toda la app)
    onAuthStateChanged(auth, (usuario) => this.manejarCambioDeUsuario(usuario));
  }

  private async manejarCambioDeUsuario(usuario: User | null) {
    if (usuario && !this.usuarioEstaAutorizado(usuario)) {
      await signOut(auth);
      this.errorRedireccion.set('No tienes permiso para acceder a esta aplicación');
      this.usuarioActual.set(null);
    } else {
      this.usuarioActual.set(usuario);
    }
    this.cargando.set(false);
    this.resolverInicializacion();
  }

  private usuarioEstaAutorizado(usuario: User): boolean {
    // Las cuentas con email/contraseña no requieren validación de lista blanca
    const esCuentaGoogle = usuario.providerData.some(p => p.providerId === 'google.com');
    if (!esCuentaGoogle) return true;

    const correo = usuario.email?.toLowerCase() ?? '';
    return environment.correosAutorizados.includes(correo);
  }

  iniciarSesion(email: string, contrasena: string) {
    return signInWithEmailAndPassword(auth, email, contrasena);
  }

  async iniciarSesionConGoogle() {
    const proveedor = new GoogleAuthProvider();
    const resultado = await signInWithPopup(auth, proveedor);

    if (!this.usuarioEstaAutorizado(resultado.user)) {
      await signOut(auth);
      throw new Error('auth/usuario-no-autorizado');
    }

    return resultado;
  }

  cerrarSesion() {
    return signOut(auth);
  }
}
