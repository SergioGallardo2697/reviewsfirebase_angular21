import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { FirestoreService, Vendedor, Paypal } from '../../core/servicios/firestore.service';
import { SoloNumerosDirective } from '../../core/directivas/solo-numeros.directive';
import { SoloDecimalesDirective } from '../../core/directivas/solo-decimales.directive';

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
  template: `
    <h2 mat-dialog-title>{{ datos.editando ? 'Editar' : 'Nueva' }} Compra</h2>
    <mat-dialog-content [formGroup]="formulario">
      <div class="fila-campos">
        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>Fecha Compra</mat-label>
          <input matInput formControlName="fechaCompra" type="date" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>Producto</mat-label>
          <input matInput formControlName="nombreProducto" />
        </mat-form-field>
      </div>

      <div class="fila-campos">
        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>Precio</mat-label>
          <input matInput formControlName="precio" appSoloDecimales inputmode="decimal" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>ID Mercadolibre</mat-label>
          <input matInput formControlName="idMercadolibre" appSoloNumeros inputmode="numeric" />
        </mat-form-field>
      </div>

      <div class="campo-primeng">
        <label class="etiqueta-primeng">Vendedor</label>
        <p-select
          [options]="vendedoresOpciones()"
          optionLabel="nombre"
          optionValue="nombre"
          [filter]="true"
          filterBy="nombre"
          placeholder="Seleccionar vendedor..."
          [formControl]="$any(formulario.get('nombreVendedor'))"
          (onChange)="alCambiarVendedor($event.value)"
          styleClass="selector-completo" />
      </div>

      <div class="fila-campos">
        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>WhatsApp Vendedor</mat-label>
          <input matInput formControlName="whatsappVendedor" [readonly]="true" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>Facebook Vendedor</mat-label>
          <input matInput formControlName="facebookVendedor" [readonly]="true" />
        </mat-form-field>
      </div>

      <div class="fila-campos">
        <div class="campo-primeng campo-mitad">
          <label class="etiqueta-primeng">Plataforma</label>
          <p-select
            [options]="plataformas"
            [formControl]="$any(formulario.get('plataforma'))"
            styleClass="selector-completo" />
        </div>

        <div class="campo-primeng campo-mitad">
          <label class="etiqueta-primeng">Ciudad Entrega</label>
          <p-select
            [options]="ciudades"
            [formControl]="$any(formulario.get('ciudadentrega'))"
            styleClass="selector-completo" />
        </div>
      </div>

      <div class="campo-primeng">
        <label class="etiqueta-primeng">PayPal</label>
        <p-select
          [options]="paypalsOpciones()"
          optionLabel="descripcion"
          optionValue="descripcion"
          [filter]="true"
          filterBy="descripcion"
          placeholder="Seleccionar paypal..."
          [formControl]="$any(formulario.get('paypal'))"
          [showClear]="true"
          styleClass="selector-completo" />
      </div>

      <div class="fila-campos">
        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>Facebook/WSP Utilizado</mat-label>
          <input matInput formControlName="facebookWspUtilizado" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="campo-mitad">
          <mat-label>Navegador Utilizado</mat-label>
          <input matInput formControlName="navegadorUtilizado" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Usuario</mat-label>
        <input matInput formControlName="usuario" />
      </mat-form-field>

      <div class="separador-opcionales">
        <span>Campos opcionales</span>
      </div>

      <div class="fila-checks">
        <mat-checkbox formControlName="bnecesitaImagen">Necesita Imagen</mat-checkbox>
        <mat-checkbox formControlName="bpublicoResena">Publicó Reseña</mat-checkbox>
      </div>
      <div class="fila-checks">
        <mat-checkbox formControlName="bcompraPagada">Compra Pagada</mat-checkbox>
        <mat-checkbox formControlName="bcompraEntregada">Compra Entregada</mat-checkbox>
      </div>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Fecha Entrega</mat-label>
        <input matInput formControlName="fechaEntrega" type="date" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="formulario.invalid">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .campo-completo {
      width: 100%;
      margin-bottom: 0.5rem;
    }
    .campo-mitad {
      flex: 1;
      min-width: 0;
    }
    .fila-campos {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      margin-top: 1rem;
    }
    .fila-checks {
      display: flex;
      gap: 2rem;
      margin-bottom: 0.75rem;
    }
    .campo-primeng {
      margin-bottom: 1rem;
    }
    .etiqueta-primeng {
      display: block;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant, #666);
      margin-bottom: 0.25rem;
    }
    :host ::ng-deep .selector-completo {
      width: 100%;
    }
    .separador-opcionales {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0.75rem 0;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant, #999);

      &::before, &::after {
        content: '';
        flex: 1;
        border-top: 1px solid var(--mat-sys-outline-variant, #ddd);
      }
    }
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      min-width: 500px;
      max-height: 70vh;
      padding-top: 1.5rem;
    }
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }
      .fila-campos {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
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
    facebookWspUtilizado: [''],
    navegadorUtilizado: [''],
    paypal: [''],
    ciudadentrega: ['Guamúchil', Validators.required],
    idMercadolibre: [''],
    usuario: [''],
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
        fechaEntrega: this.datos.fechaEntrega || ''
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
