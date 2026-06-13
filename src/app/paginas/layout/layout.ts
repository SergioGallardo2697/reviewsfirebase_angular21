import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AutenticacionService } from '../../core/servicios/autenticacion.service';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
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

  esMobile = signal(window.innerWidth < 768);
  menuAbierto = signal(true);

  @HostListener('window:resize')
  onResize() {
    this.esMobile.set(window.innerWidth < 768);
  }

  toggleMenu() {
    this.menuAbierto.set(!this.menuAbierto());
  }

  navegarY(ruta: string) {
    this.router.navigate([ruta]);
    if (this.esMobile()) {
      this.menuAbierto.set(false);
    }
  }

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
