import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MatDialog } from '@angular/material/dialog';
import { FirestoreService, Vendedor } from '../../core/servicios/firestore.service';
import { DialogoVendedor, DatosDialogoVendedor } from './dialogo-vendedor/dialogo-vendedor';
import { SoloLetrasDirective } from '../../core/directivas/solo-letras.directive';
import { SoloNumerosDirective } from '../../core/directivas/solo-numeros.directive';
import { normalizarTexto } from '../../core/utilidades/texto.util';

const ANCHO_DIALOGO = '450px';
const CAMPO_ORDEN_DEFECTO = 'nombre';

@Component({
  selector: 'app-vendedores',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SoloLetrasDirective,
    SoloNumerosDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './vendedores.html',
  styleUrl: './vendedores.scss'
})
export class Vendedores {
  private readonly firestoreService = inject(FirestoreService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialog = inject(MatDialog);

  // onSnapshot via Observable → signal; undefined mientras llega el primer snapshot
  readonly vendedores = toSignal(this.firestoreService.vendedoresEnTiempoReal());
  readonly busqueda = signal('');

  readonly cargando = computed(() => this.vendedores() === undefined);

  readonly vendedoresFiltrados = computed(() => {
    const termino = normalizarTexto(this.busqueda());
    const lista = this.vendedores() ?? [];
    if (!termino) return lista;
    return lista.filter(v =>
      normalizarTexto(v.nombre).includes(termino) ||
      normalizarTexto(v.facebook).includes(termino) ||
      normalizarTexto(v.whatsapp).includes(termino)
    );
  });

  limpiar(tabla: Table) {
    this.busqueda.set('');
    tabla.sortField = CAMPO_ORDEN_DEFECTO;
    tabla.sortOrder = 1;
    tabla.first = 0;
    tabla.sortSingle();
  }

  async guardarCampo(vendedor: Vendedor) {
    if (!vendedor.id) return;
    try {
      await this.firestoreService.actualizarVendedor(vendedor.id, {
        nombre: vendedor.nombre,
        facebook: vendedor.facebook,
        whatsapp: vendedor.whatsapp
      });
    } catch {
      this.mostrarError('No se pudo guardar el cambio');
    }
  }

  abrirDialogoAgregar() {
    this.abrirDialogo({ nombre: '', facebook: '', whatsapp: '', editando: false });
  }

  abrirDialogoEditar(vendedor: Vendedor) {
    if (!vendedor.id) return;
    this.abrirDialogo({
      nombre: vendedor.nombre,
      facebook: vendedor.facebook || '',
      whatsapp: vendedor.whatsapp || '',
      editando: true
    }, vendedor.id);
  }

  private abrirDialogo(datos: DatosDialogoVendedor, id?: string) {
    const dialogRef = this.dialog.open<DialogoVendedor, DatosDialogoVendedor, DatosDialogoVendedor | undefined>(
      DialogoVendedor,
      { width: ANCHO_DIALOGO, data: datos, disableClose: true }
    );

    dialogRef.afterClosed().subscribe(async (resultado) => {
      if (!resultado) return;
      try {
        if (id) {
          await this.firestoreService.actualizarVendedor(id, resultado);
          this.mostrarExito('Vendedor actualizado');
        } else {
          await this.firestoreService.agregarVendedor({
            nombre: resultado.nombre,
            facebook: resultado.facebook,
            whatsapp: resultado.whatsapp,
            estatus: 1
          });
          this.mostrarExito('Vendedor creado correctamente');
        }
      } catch {
        this.mostrarError('No se pudo guardar el vendedor');
      }
    });
  }

  confirmarEliminar(vendedor: Vendedor) {
    if (!vendedor.id) return;
    const id = vendedor.id;
    this.confirmationService.confirm({
      message: `¿Eliminar a "${vendedor.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.firestoreService.eliminarVendedor(id);
          this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'Vendedor eliminado' });
        } catch {
          this.mostrarError('No se pudo eliminar el vendedor');
        }
      }
    });
  }

  private mostrarExito(detalle: string) {
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: detalle });
  }

  private mostrarError(detalle: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: detalle });
  }
}
