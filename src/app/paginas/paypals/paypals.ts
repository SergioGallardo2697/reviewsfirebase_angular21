import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { FirestoreService, Paypal } from '../../core/servicios/firestore.service';
import { DialogoPaypal } from './dialogo-paypal/dialogo-paypal';
import { SoloLetrasDirective } from '../../core/directivas/solo-letras.directive';
import { SoloNumerosDirective } from '../../core/directivas/solo-numeros.directive';
import { normalizarTexto } from '../../core/utilidades/texto.util';

// Tipado fuerte para los datos que recibe/devuelve el diálogo
interface DatosDialogoPaypal {
  banco: string;
  clabe: string;
  descripcion: string;
  navegador: string;
  propietario: string;
  editando: boolean;
}

const ANCHO_DIALOGO = '450px';
const CAMPO_ORDEN_DEFECTO = 'descripcion';

@Component({
  selector: 'app-paypals',
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
  templateUrl: './paypals.html',
  styleUrl: './paypals.scss'
})
export class Paypals implements OnInit {
  private readonly firestoreService = inject(FirestoreService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialog = inject(MatDialog);

  // Estado reactivo con signals
  readonly paypals = signal<Paypal[]>([]);
  readonly busqueda = signal('');
  readonly cargando = signal(true);

  // Lista filtrada derivada automáticamente del estado
  readonly paypalsFiltrados = computed(() => {
    const termino = normalizarTexto(this.busqueda());
    const lista = this.paypals();
    if (!termino) return lista;
    return lista.filter(p =>
      normalizarTexto(p.banco).includes(termino) ||
      normalizarTexto(p.clabe).includes(termino) ||
      normalizarTexto(p.descripcion).includes(termino) ||
      normalizarTexto(p.propietario).includes(termino) ||
      normalizarTexto(p.navegador).includes(termino)
    );
  });

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const datos = await this.firestoreService.obtenerPaypals();
      this.paypals.set(datos);
    } catch {
      this.mostrarError('No se pudieron cargar los paypals');
    } finally {
      this.cargando.set(false);
    }
  }

  limpiar(tabla: Table) {
    this.busqueda.set('');
    tabla.sortField = CAMPO_ORDEN_DEFECTO;
    tabla.sortOrder = 1;
    tabla.first = 0;
    tabla.sortSingle();
  }

  // Edición inline: persiste un solo registro modificado en la tabla
  async guardarCampo(paypal: Paypal) {
    if (!paypal.id) return;
    try {
      await this.firestoreService.actualizarPaypal(paypal.id, {
        banco: paypal.banco,
        clabe: paypal.clabe,
        descripcion: paypal.descripcion,
        navegador: paypal.navegador,
        propietario: paypal.propietario
      });
    } catch {
      this.mostrarError('No se pudo guardar el cambio');
    }
  }

  abrirDialogoAgregar() {
    this.abrirDialogo({
      banco: '', clabe: '', descripcion: '', navegador: '', propietario: '', editando: false
    });
  }

  abrirDialogoEditar(paypal: Paypal) {
    if (!paypal.id) return;
    this.abrirDialogo({
      banco: paypal.banco,
      clabe: paypal.clabe,
      descripcion: paypal.descripcion || '',
      navegador: paypal.navegador || '',
      propietario: paypal.propietario,
      editando: true
    }, paypal.id);
  }

  private abrirDialogo(datos: DatosDialogoPaypal, id?: string) {
    const dialogRef = this.dialog.open<DialogoPaypal, DatosDialogoPaypal, DatosDialogoPaypal | undefined>(
      DialogoPaypal,
      { width: ANCHO_DIALOGO, data: datos, disableClose: true }
    );

    dialogRef.afterClosed().subscribe(async (resultado) => {
      if (!resultado) return;
      try {
        if (id) {
          await this.firestoreService.actualizarPaypal(id, resultado);
          this.mostrarExito('Paypal actualizado');
        } else {
          await this.firestoreService.agregarPaypal({
            banco: resultado.banco,
            clabe: resultado.clabe,
            descripcion: resultado.descripcion,
            navegador: resultado.navegador,
            propietario: resultado.propietario,
            estatus: 1
          });
          this.mostrarExito('Paypal creado correctamente');
        }
        await this.cargar();
      } catch {
        this.mostrarError('No se pudo guardar el paypal');
      }
    });
  }

  confirmarEliminar(paypal: Paypal) {
    if (!paypal.id) return;
    const id = paypal.id;
    this.confirmationService.confirm({
      message: `¿Eliminar paypal de "${paypal.propietario || paypal.descripcion}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.firestoreService.eliminarPaypal(id);
          await this.cargar();
          this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'Paypal eliminado' });
        } catch {
          this.mostrarError('No se pudo eliminar el paypal');
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
