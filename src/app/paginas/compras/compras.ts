import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toSignal, toObservable } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { PopoverModule } from 'primeng/popover';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MatDialog } from '@angular/material/dialog';
import { FirestoreService, Compra } from '../../core/servicios/firestore.service';
import { DialogoCompra, DatosDialogoCompra } from './dialogo-compra/dialogo-compra';
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
    SelectModule,
    CheckboxModule,
    PopoverModule,
    DecimalPipe,
    SoloDecimalesDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './compras.html',
  styleUrl: './compras.scss'
})
export class Compras {
  private readonly firestoreService = inject(FirestoreService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialog = inject(MatDialog);
  private readonly rutaActiva = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly segmentoActual = signal('todas');
  readonly busqueda = signal('');
  readonly busquedaPrecio = signal('');

  // Búsqueda por rango de fechaCompra
  readonly fechaInicio = signal('');
  readonly fechaFin = signal('');
  readonly busquedaRealizada = signal(false);
  readonly esModoBusqueda = computed(() => this.segmentoActual() === 'buscar');

  // Catálogos en tiempo real (onSnapshot). undefined hasta el primer snapshot.
  private readonly vendedoresTr = toSignal(this.firestoreService.vendedoresEnTiempoReal());
  private readonly paypalsTr = toSignal(this.firestoreService.paypalsEnTiempoReal());
  readonly vendedoresOpciones = computed(() => this.vendedoresTr() ?? []);
  readonly paypalsOpciones = computed(() => this.paypalsTr() ?? []);

  // Resultados del modo "buscar" (getDocs puntual, no en tiempo real)
  private readonly comprasBusqueda = signal<Compra[]>([]);

  // Lista de compras en tiempo real según el segmento. En modo "buscar" no
  // escucha nada (emite []), y la lista visible se toma de comprasBusqueda.
  private readonly comprasTr = toSignal(
    toObservable(this.segmentoActual).pipe(
      switchMap(segmento => {
        if (segmento === 'buscar') return of<Compra[]>([]);
        if (segmento === 'con-resena') return this.firestoreService.comprasEnTiempoReal(true);
        if (segmento === 'sin-resena') return this.firestoreService.comprasEnTiempoReal(false);
        return this.firestoreService.comprasEnTiempoReal(null);
      })
    )
  );

  readonly compras = computed(() =>
    this.esModoBusqueda() ? this.comprasBusqueda() : (this.comprasTr() ?? [])
  );

  readonly cargando = computed(() =>
    this.esModoBusqueda() ? false : this.comprasTr() === undefined
  );

  readonly filtroCiudades = signal<string[]>([]);
  readonly filtroEntregadas = signal<boolean | null>(null);
  readonly filtroImagen = signal<boolean | null>(null);

  readonly filtrosActivos = computed(() =>
    this.filtroCiudades().length > 0 || this.filtroEntregadas() !== null || this.filtroImagen() !== null
  );

  readonly plataformas = ['Mercadolibre', 'Amazon', 'Tiktok', 'Shein', 'Temu'];
  readonly ciudades = ['Guamúchil', 'Culiacán', 'Navolato'];

  readonly filtroResena = computed(() => {
    const segmento = this.segmentoActual();
    if (segmento === 'con-resena') return true;
    if (segmento === 'sin-resena') return false;
    return null;
  });

  readonly mostrarSaldo = computed(() => {
    const segmento = this.segmentoActual();
    return segmento === 'sin-resena' || segmento === 'con-resena';
  });

  readonly saldoPendiente = computed(() => {
    return this.compras()
      .filter(c => !c.bcompraPagada && c.estatus === 1)
      .reduce((total, c) => total + (Number(c.precio) || 0), 0);
  });

  readonly tituloPagina = computed(() => {
    if (this.segmentoActual() === 'buscar') return 'Buscar Compras por Fecha';
    const filtro = this.filtroResena();
    if (filtro === true) return 'Compras con Reseña';
    if (filtro === false) return 'Compras sin Reseña';
    return 'Todas las Compras';
  });

  readonly comprasFiltradas = computed(() => {
    const termino = normalizarTexto(this.busqueda());
    const terminoPrecio = this.busquedaPrecio().trim();
    const ciudades = this.filtroCiudades();
    const entregadas = this.filtroEntregadas();
    const imagen = this.filtroImagen();
    let lista = this.compras();

    if (ciudades.length > 0) {
      lista = lista.filter(c => ciudades.includes(c.ciudadentrega));
    }
    if (entregadas !== null) {
      lista = lista.filter(c => c.bcompraEntregada === entregadas);
    }
    if (imagen !== null) {
      lista = lista.filter(c => c.bnecesitaImagen === imagen);
    }

    if (termino) {
      lista = lista.filter(c =>
        normalizarTexto(c.nombreProducto).includes(termino) ||
        normalizarTexto(c.nombreVendedor).includes(termino) ||
        normalizarTexto(c.plataforma).includes(termino) ||
        normalizarTexto(c.ciudadentrega).includes(termino) ||
        normalizarTexto(c.usuario).includes(termino) ||
        normalizarTexto(c.fechaCompra).includes(termino) ||
        normalizarTexto(c.paypal).includes(termino)
      );
    }

    if (terminoPrecio) {
      lista = lista.filter(c =>
        Number(c.precio).toFixed(2).includes(terminoPrecio)
      );
    }

    return lista;
  });

  constructor() {
    // Suscripción al observable de la URL para detectar cambios de segmento
    // aunque el componente sea reutilizado por Angular entre subrutas.
    // takeUntilDestroyed cancela la suscripción al destruir el componente.
    // Al fijar segmentoActual, comprasTr conmuta solo al listener correspondiente.
    this.rutaActiva.url.pipe(takeUntilDestroyed()).subscribe(segmentos => {
      const segmento = segmentos[0]?.path ?? 'todas';
      this.segmentoActual.set(segmento);
      this.busqueda.set('');
      this.busquedaPrecio.set('');
      this.fechaInicio.set('');
      this.fechaFin.set('');
      this.busquedaRealizada.set(false);
      this.comprasBusqueda.set([]);
    });
  }

  // Busca compras en Firestore acotadas por el rango de fechaCompra seleccionado
  async buscarPorRango() {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();
    if (!inicio || !fin) {
      this.mostrarError('Selecciona la fecha de inicio y la fecha de fin');
      return;
    }
    if (inicio > fin) {
      this.mostrarError('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }
    try {
      const datos = await this.firestoreService.obtenerComprasPorRangoFecha(inicio, fin);
      this.comprasBusqueda.set(datos);
      this.busquedaRealizada.set(true);
      if (datos.length === 0) {
        this.messageService.add({ severity: 'info', summary: 'Sin resultados', detail: 'No hay compras en ese rango de fechas' });
      }
    } catch {
      this.mostrarError('No se pudieron buscar las compras');
    }
  }

  limpiar(tabla: Table) {
    this.busqueda.set('');
    this.busquedaPrecio.set('');
    this.filtroCiudades.set([]);
    this.filtroEntregadas.set(null);
    this.filtroImagen.set(null);
    tabla.sortField = CAMPO_ORDEN_DEFECTO;
    tabla.sortOrder = -1;
    tabla.first = 0;
    tabla.sortSingle();
  }

  alternarCiudad(ciudad: string) {
    const actuales = this.filtroCiudades();
    if (actuales.includes(ciudad)) {
      this.filtroCiudades.set(actuales.filter(c => c !== ciudad));
    } else {
      this.filtroCiudades.set([...actuales, ciudad]);
    }
  }

  exportarCsv() {
    const lista = this.comprasFiltradas();
    const filas = lista.map(c =>
      `${c.id},${(c.nombreProducto || '').replaceAll(',', ' ')}`
    );
    const contenido = 'ID,Nombre del Producto\n' + filas.join('\n');
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'productos.csv';
    enlace.click();
    URL.revokeObjectURL(url);
  }
  async guardarCampo(compra: Compra) {
    if (!compra.id) return;
    try {
      const { id, ...datos } = compra;

      // Al marcar como entregada se registra la fecha actual; al desmarcar se borra
      const fechaEntrega = this.resolverFechaEntrega(datos.bcompraEntregada, datos.fechaEntrega);
      datos.fechaEntrega = fechaEntrega;
      compra.fechaEntrega = fechaEntrega;

      await this.firestoreService.actualizarCompra(compra.id, datos);

      // En segmentos en tiempo real, onSnapshot refresca la lista solo (incluso
      // descartando registros que ya no cumplen el filtro). Solo "buscar" necesita
      // re-ejecutar la consulta puntual por rango.
      await this.recargarVistaActual();
    } catch {
      this.mostrarError('No se pudo guardar el cambio');
    }
  }

  // Solo el modo "buscar" usa getDocs puntual: repite la consulta por rango si ya
  // se buscó, para reflejar el cambio. El resto se actualiza vía onSnapshot.
  private async recargarVistaActual() {
    if (this.segmentoActual() === 'buscar' && this.busquedaRealizada()) {
      await this.buscarPorRango();
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
      { width: ANCHO_DIALOGO, data: datos, disableClose: true }
    );

    dialogRef.afterClosed().subscribe(async (resultado) => {
      if (!resultado) return;
      try {
        const { editando, ...camposCompra } = resultado;
        const datosGuardar = { ...camposCompra, precio: Number(camposCompra.precio) || 0 };

        // Si se marcó como entregada y no tiene fecha, se asigna la fecha actual
        datosGuardar.fechaEntrega = this.resolverFechaEntrega(datosGuardar.bcompraEntregada, datosGuardar.fechaEntrega);

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
        await this.recargarVistaActual();
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
          await this.recargarVistaActual();
          this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'Compra eliminada' });
        } catch {
          this.mostrarError('No se pudo eliminar la compra');
        }
      }
    });
  }

  // Devuelve la clase CSS de alerta según los días transcurridos desde la entrega:
  // azul a partir de 14 días, amarillo desde 21 y rojo desde 29.
  // No aplica en la sección "todas", solo en con-reseña y sin-reseña
  claseAlertaEntrega(compra: Compra): string {
    const segmento = this.segmentoActual();
    if (segmento === 'todas' || segmento === 'buscar') return '';
    const dias = this.diasDesdeEntrega(compra.fechaEntrega);
    if (dias === null) return '';
    if (dias >= 29) return 'alerta-entrega-rojo';
    if (dias >= 21) return 'alerta-entrega-amarillo';
    if (dias >= 14) return 'alerta-entrega-azul';
    return '';
  }

  // Calcula los días completos transcurridos desde la fecha de entrega (formato YYYY-MM-DD).
  // Devuelve null si no hay fecha válida
  private diasDesdeEntrega(fechaEntrega: string): number | null {
    if (!fechaEntrega) return null;
    const partes = fechaEntrega.split('-').map(Number);
    if (partes.length !== 3 || partes.some(n => Number.isNaN(n))) return null;
    const [anio, mes, dia] = partes;
    const inicioEntrega = Date.UTC(anio, mes - 1, dia);
    const ahora = new Date();
    const inicioHoy = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    return Math.floor((inicioHoy - inicioEntrega) / 86400000);
  }

  // Calcula la fecha de entrega: hoy si se entrega sin fecha previa,
  // vacía si no está entregada, o conserva la fecha existente
  private resolverFechaEntrega(entregada: boolean, fechaActual: string): string {
    if (!entregada) return '';
    return fechaActual || new Date().toISOString().split('T')[0];
  }

  private mostrarExito(detalle: string) {
    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: detalle });
  }

  private mostrarError(detalle: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: detalle });
  }
}
