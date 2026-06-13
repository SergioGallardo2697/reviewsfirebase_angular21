import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./paginas/login/login').then(m => m.Login),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./paginas/layout/layout').then(m => m.Layout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'vendedores', pathMatch: 'full' },
      { path: 'vendedores', loadComponent: () => import('./paginas/vendedores/vendedores').then(m => m.Vendedores) },
      { path: 'paypals', loadComponent: () => import('./paginas/paypals/paypals').then(m => m.Paypals) },
      { path: 'compras', loadComponent: () => import('./paginas/compras/compras').then(m => m.Compras) }
    ]
  },
  { path: '**', redirectTo: '' }
];
