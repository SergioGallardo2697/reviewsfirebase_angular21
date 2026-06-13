import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SoloLetrasDirective } from '../../core/directivas/solo-letras.directive';
import { SoloNumerosDirective } from '../../core/directivas/solo-numeros.directive';

@Component({
  selector: 'app-dialogo-vendedor',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    SoloLetrasDirective,
    SoloNumerosDirective
  ],
  template: `
    <h2 mat-dialog-title>{{ datos.editando ? 'Editar' : 'Nuevo' }} Vendedor</h2>
    <mat-dialog-content [formGroup]="formulario">
      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="nombre" appSoloLetras />
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Facebook (opcional)</mat-label>
        <input matInput formControlName="facebook" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>WhatsApp (opcional)</mat-label>
        <input matInput formControlName="whatsapp" appSoloNumeros inputmode="numeric" />
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
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      min-width: 350px;
      padding-top: 1rem;
      overflow: visible;
    }
  `]
})
export class DialogoVendedor implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DialogoVendedor>);
  private readonly fb = inject(FormBuilder);
  datos = inject(MAT_DIALOG_DATA);

  formulario: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    facebook: [''],
    whatsapp: ['']
  });

  ngOnInit() {
    this.formulario.patchValue({
      nombre: this.datos.nombre || '',
      facebook: this.datos.facebook || '',
      whatsapp: this.datos.whatsapp || ''
    });
  }

  cancelar() {
    this.dialogRef.close();
  }

  guardar() {
    if (this.formulario.valid) {
      this.dialogRef.close(this.formulario.value);
    }
  }
}
