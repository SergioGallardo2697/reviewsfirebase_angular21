import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { FirestoreService, Paypal, Vendedor } from '../../../core/servicios/firestore.service';
import { SoloNumerosDirective } from '../../../core/directivas/solo-numeros.directive';

@Component({
  selector: 'app-buscar-paypal',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    TooltipModule,
    SelectModule,
    CheckboxModule,
    SoloNumerosDirective,
  ],
  providers: [MessageService],
  templateUrl: './buscar-paypal.html',
  styleUrl: './buscar-paypal.scss'
})
export class BuscarPaypal implements OnInit {
  private readonly firestoreService = inject(FirestoreService);
  private readonly messageService = inject(MessageService);

  readonly vendedores = signal<Vendedor[]>([]);
  readonly vendedorSeleccionado = signal<Vendedor | null>(null);
  readonly diasStr = signal('60');
  readonly nuncaUsados = signal(false);
  readonly paypalsDisponibles = signal<Paypal[]>([]);
  readonly cargando = signal(false);
  readonly busquedaRealizada = signal(false);

  ngOnInit() {
    this.cargarVendedores();
  }

  private async cargarVendedores() {
    try {
      const lista = await this.firestoreService.obtenerVendedoresOrdenados();
      this.vendedores.set(lista);
    } catch {
      this.mostrarError('No se pudieron cargar los vendedores');
    }
  }

  async buscar() {
    const vendedor = this.vendedorSeleccionado();
    if (!vendedor) {
      this.mostrarError('Selecciona un vendedor');
      return;
    }

    this.cargando.set(true);
    try {
      const [todosPaypals, comprasVendedor] = await Promise.all([
        this.firestoreService.obtenerPaypalsOrdenados(),
        this.nuncaUsados()
          ? this.firestoreService.obtenerComprasPorVendedor(vendedor.nombre)
          : this.firestoreService.obtenerComprasPorVendedorDesde(vendedor.nombre, this.calcularFechaDesde())
      ]);

      const paypalsUsados = new Set(comprasVendedor.map(c => c.paypal).filter(Boolean));
      const disponibles = todosPaypals.filter(p => !paypalsUsados.has(p.descripcion));

      this.paypalsDisponibles.set(disponibles);
      this.busquedaRealizada.set(true);

      if (disponibles.length === 0) {
        this.messageService.add({
          severity: 'info',
          summary: 'Sin resultados',
          detail: 'No hay paypals disponibles para ese vendedor'
        });
      }
    } catch {
      this.mostrarError('No se pudo realizar la búsqueda. Si el error persiste, verifica los índices de Firestore.');
    } finally {
      this.cargando.set(false);
    }
  }

  limpiar() {
    this.vendedorSeleccionado.set(null);
    this.diasStr.set('60');
    this.nuncaUsados.set(false);
    this.paypalsDisponibles.set([]);
    this.busquedaRealizada.set(false);
  }

  private calcularFechaDesde(): string {
    const dias = Number.parseInt(this.diasStr() || '0', 10);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString().split('T')[0];
  }

  private mostrarError(detalle: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: detalle });
  }
}
