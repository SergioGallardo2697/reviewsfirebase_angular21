import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AutenticacionService } from '../../core/servicios/autenticacion.service';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  protected readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);

  readonly menuItems = [
    { ruta: '/vendedores', icono: 'people', etiqueta: 'Vendedores' },
    { ruta: '/paypals', icono: 'account_balance', etiqueta: 'Paypals' },
    { ruta: '/compras', icono: 'shopping_cart', etiqueta: 'Compras' }
  ];

  obtenerIniciales(texto: string): string {
    const partes = texto.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return texto.substring(0, 2).toUpperCase();
  }

  async cerrarSesion() {
    await this.autenticacionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
