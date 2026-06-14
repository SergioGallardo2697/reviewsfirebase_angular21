import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MatDialog } from '@angular/material/dialog';
import { FirestoreService, Compra } from '../../core/servicios/firestore.service';
import { DialogoCompra, DatosDialogoCompra } from './dialogo-compra';
import { SoloDecimalesDirective } from '../../core/directivas/solo-decimales.directive';
import { normalizarTexto } from '../../core/utilidades/texto.util';

const ANCHO_DIALOGO = '650px';
const CAMPO_ORDEN_DEFECTO = 'fechaCompra';

@Component({
  selector: 'app-compras',
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
    TagModule,
    DecimalPipe,
    SoloDecimalesDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './compras.html',
  styleUrl: './compras.scss'
})
export class Compras implements OnInit {
  private readonly firestoreService = inject(FirestoreService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialog = inject(MatDialog);

  readonly compras = signal<Compra[]>([]);
  readonly busqueda = signal('');
  readonly cargando = signal(true);

  readonly comprasFiltradas = computed(() => {
    const termino = normalizarTexto(this.busqueda());
    const lista = this.compras();
    if (!termino) return lista;
    return lista.filter(c =>
      normalizarTexto(c.nombreProducto).includes(termino) ||
      normalizarTexto(c.nombreVendedor).includes(termino) ||
      normalizarTexto(c.plataforma).includes(termino) ||
      normalizarTexto(c.ciudadentrega).includes(termino) ||
      normalizarTexto(c.usuario).includes(termino) ||
      normalizarTexto(c.fechaCompra).includes(termino) ||
      normalizarTexto(c.paypal).includes(termino) ||
      normalizarTexto(String(c.precio)).includes(termino)
    );
  });

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.cargando.set(true);
    try {
      const datos = await this.firestoreService.obtenerCompras();
      this.compras.set(datos);
    } catch {
      this.mostrarError('No se pudieron cargar las compras');
    } finally {
      this.cargando.set(false);
    }
  }

  limpiar(tabla: Table) {
    this.busqueda.set('');
    tabla.sortField = CAMPO_ORDEN_DEFECTO;
    tabla.sortOrder = -1;
    tabla.first = 0;
    tabla.sortSingle();
  }

  async guardarCampo(compra: Compra) {
    if (!compra.id) return;
    try {
      const { id, ...datos } = compra;
      await this.firestoreService.actualizarCompra(compra.id, datos);
    } catch {
      this.mostrarError('No se pudo guardar el cambio');
    }
  }

  abrirDialogoAgregar() {
    this.abrirDialogo({
      fechaCompra: '',
      nombreProducto: '',
      precio: '',
      nombreVendedor: '',
      whatsappVendedor: '',
      facebookVendedor: '',
      plataforma: 'Mercadolibre',
      facebookWspUtilizado: '',
      navegadorUtilizado: '',
      paypal: '',
      ciudadentrega: 'Guamúchil',
      idMercadolibre: '',
      usuario: '',
      bnecesitaImagen: false,
      bpublicoResena: false,
      bcompraPagada: false,
      bcompraEntregada: false,
      fechaEntrega: '',
      editando: false
    });
  }

  abrirDialogoEditar(compra: Compra) {
    if (!compra.id) return;
    this.abrirDialogo({
      fechaCompra: compra.fechaCompra || '',
      nombreProducto: compra.nombreProducto || '',
      precio: compra.precio ?? '',
      nombreVendedor: compra.nombreVendedor || '',
      whatsappVendedor: compra.whatsappVendedor || '',
      facebookVendedor: compra.facebookVendedor || '',
      plataforma: compra.plataforma || 'Mercadolibre',
      facebookWspUtilizado: compra.facebookWspUtilizado || '',
      navegadorUtilizado: compra.navegadorUtilizado || '',
      paypal: compra.paypal || '',
      ciudadentrega: compra.ciudadentrega || 'Guamúchil',
      idMercadolibre: compra.idMercadolibre || '',
      usuario: compra.usuario || '',
      bnecesitaImagen: compra.bnecesitaImagen ?? false,
      bpublicoResena: compra.bpublicoResena ?? false,
      bcompraPagada: compra.bcompraPagada ?? false,
      bcompraEntregada: compra.bcompraEntregada ?? false,
      fechaEntrega: compra.fechaEntrega || '',
      editando: true
    }, compra.id);
  }

  private abrirDialogo(datos: DatosDialogoCompra, id?: string) {
    const dialogRef = this.dialog.open<DialogoCompra, DatosDialogoCompra, DatosDialogoCompra | undefined>(
      DialogoCompra,
      { width: ANCHO_DIALOGO, data: datos }
    );

    dialogRef.afterClosed().subscribe(async (resultado) => {
      if (!resultado) return;
      try {
        // Remover el campo 'editando' antes de guardar en Firestore
        const { editando, ...camposCompra } = resultado;
        const datosGuardar = { ...camposCompra, precio: Number(camposCompra.precio) || 0 };
        if (id) {
          await this.firestoreService.actualizarCompra(id, datosGuardar);
          this.mostrarExito('Compra actualizada');
        } else {
          await this.firestoreService.agregarCompra({
            ...datosGuardar,
            estatus: 1
          });
          this.mostrarExito('Compra creada correctamente');
        }
        await this.cargar();
      } catch {
        this.mostrarError('No se pudo guardar la compra');
      }
    });
  }

  confirmarEliminar(compra: Compra) {
    if (!compra.id) return;
    const id = compra.id;
    this.confirmationService.confirm({
      message: `¿Eliminar compra de "${compra.nombreProducto}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.firestoreService.eliminarCompra(id);
          await this.cargar();
          this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'Compra eliminada' });
        } catch {
          this.mostrarError('No se pudo eliminar la compra');
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
