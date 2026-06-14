import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { FirestoreService, Vendedor, Paypal } from '../../../core/servicios/firestore.service';
import { SoloNumerosDirective } from '../../../core/directivas/solo-numeros.directive';
import { SoloDecimalesDirective } from '../../../core/directivas/solo-decimales.directive';

// Datos que recibe y devuelve el diálogo
export interface DatosDialogoCompra {
  fechaCompra: string;
  nombreProducto: string;
  precio: number | string;
  nombreVendedor: string;
  whatsappVendedor: string;
  facebookVendedor: string;
  plataforma: string;
  facebookWspUtilizado: string;
  navegadorUtilizado: string;
  paypal: string;
  ciudadentrega: string;
  idMercadolibre: string;
  usuario: string;
  bnecesitaImagen: boolean;
  bpublicoResena: boolean;
  bcompraPagada: boolean;
  bcompraEntregada: boolean;
  fechaEntrega: string;
  editando: boolean;
}

const PLATAFORMAS = ['Mercadolibre', 'Amazon', 'Tiktok', 'Shein', 'Temu'];
const CIUDADES = ['Guamúchil', 'Culiacán', 'Navolato'];

@Component({
  selector: 'app-dialogo-compra',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    SelectModule,
    SoloNumerosDirective,
    SoloDecimalesDirective
  ],
  templateUrl: './dialogo-compra.html',
  styleUrl: './dialogo-compra.scss'
})
export class DialogoCompra implements OnInit {

  private readonly dialogRef = inject(MatDialogRef<DialogoCompra>);
  private readonly fb = inject(FormBuilder);
  private readonly firestoreService = inject(FirestoreService);
  datos = inject<DatosDialogoCompra>(MAT_DIALOG_DATA);

  readonly vendedoresOpciones = signal<Vendedor[]>([]);
  readonly paypalsOpciones = signal<Paypal[]>([]);
  readonly plataformas = PLATAFORMAS;
  readonly ciudades = CIUDADES;

  // Referencia interna para buscar vendedor por nombre
  private vendedoresLista: Vendedor[] = [];

  formulario: FormGroup = this.fb.group({
    fechaCompra: ['', Validators.required],
    nombreProducto: ['', Validators.required],
    precio: ['', Validators.required],
    nombreVendedor: ['', Validators.required],
    whatsappVendedor: [{ value: '', disabled: true }],
    facebookVendedor: [{ value: '', disabled: true }],
    plataforma: ['Mercadolibre', Validators.required],
    facebookWspUtilizado: ['', Validators.required],
    navegadorUtilizado: ['', Validators.required],
    paypal: ['', Validators.required],
    ciudadentrega: ['Guamúchil', Validators.required],
    idMercadolibre: ['', Validators.required],
    usuario: ['', Validators.required],
    bnecesitaImagen: [false],
    bpublicoResena: [false],
    bcompraPagada: [false],
    bcompraEntregada: [false],
    fechaEntrega: ['']
  });

  async ngOnInit() {
    await this.cargarCatalogos();

    if (this.datos.editando) {
      this.formulario.patchValue({
        fechaCompra: this.datos.fechaCompra || '',
        nombreProducto: this.datos.nombreProducto || '',
        precio: this.datos.precio ?? '',
        nombreVendedor: this.datos.nombreVendedor || '',
        whatsappVendedor: this.datos.whatsappVendedor || '',
        facebookVendedor: this.datos.facebookVendedor || '',
        plataforma: this.datos.plataforma || 'Mercadolibre',
        facebookWspUtilizado: this.datos.facebookWspUtilizado || '',
        navegadorUtilizado: this.datos.navegadorUtilizado || '',
        paypal: this.datos.paypal || '',
        ciudadentrega: this.datos.ciudadentrega || 'Guamúchil',
        idMercadolibre: this.datos.idMercadolibre || '',
        usuario: this.datos.usuario || '',
        bnecesitaImagen: this.datos.bnecesitaImagen ?? false,
        bpublicoResena: this.datos.bpublicoResena ?? false,
        bcompraPagada: this.datos.bcompraPagada ?? false,
        bcompraEntregada: this.datos.bcompraEntregada ?? false,
        fechaEntrega: this.datos.fechaEntrega ||
          (this.datos.bcompraEntregada ? new Date().toISOString().split('T')[0] : '')
      });
    } else {
      // Al agregar, poner la fecha actual por defecto
      const hoy = new Date().toISOString().split('T')[0];
      this.formulario.patchValue({ fechaCompra: hoy });
    }
  }

  private async cargarCatalogos() {
    try {
      const [vendedores, paypals] = await Promise.all([
        this.firestoreService.obtenerVendedoresOrdenados(),
        this.firestoreService.obtenerPaypalsOrdenados()
      ]);
      this.vendedoresLista = vendedores;
      this.vendedoresOpciones.set(vendedores);
      this.paypalsOpciones.set(paypals);
    } catch {
      // Si falla la carga de catálogos, los selects quedarán vacíos
    }
  }

  alCambiarVendedor(nombreSeleccionado: string) {
    const vendedor = this.vendedoresLista.find(v => v.nombre === nombreSeleccionado);
    if (vendedor) {
      this.formulario.patchValue({
        whatsappVendedor: vendedor.whatsapp || '',
        facebookVendedor: vendedor.facebook || ''
      });
    } else {
      this.formulario.patchValue({
        whatsappVendedor: '',
        facebookVendedor: ''
      });
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.formulario.valid) {
      // getRawValue() incluye los campos deshabilitados (whatsapp y facebook vendedor)
      const valores = this.formulario.getRawValue();
      valores.precio = parseFloat(valores.precio) || 0;
      this.dialogRef.close(valores);
    }
  }
}
