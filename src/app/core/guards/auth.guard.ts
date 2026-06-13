import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AutenticacionService } from '../servicios/autenticacion.service';

// Protege rutas privadas: si no hay sesión redirige al login
export const authGuard: CanActivateFn = async () => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);

  await autenticacionService.inicializado;

  return autenticacionService.usuarioActual()
    ? true
    : router.createUrlTree(['/login']);
};

// Protege la pantalla de login: si ya hay sesión redirige al inicio
export const loginGuard: CanActivateFn = async () => {
  const autenticacionService = inject(AutenticacionService);
  const router = inject(Router);

  await autenticacionService.inicializado;

  return autenticacionService.usuarioActual()
    ? router.createUrlTree(['/'])
    : true;
};
