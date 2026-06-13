import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SoloLetrasDirective } from '../../core/directivas/solo-letras.directive';
import { SoloNumerosDirective } from '../../core/directivas/solo-numeros.directive';

@Component({
  selector: 'app-dialogo-paypal',
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
    <h2 mat-dialog-title>{{ datos.editando ? 'Editar' : 'Nuevo' }} Paypal</h2>
    <mat-dialog-content [formGroup]="formulario">
      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Banco</mat-label>
        <input matInput formControlName="banco" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>CLABE</mat-label>
        <input matInput formControlName="clabe" appSoloNumeros inputmode="numeric" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Descripción (correo)</mat-label>
        <input matInput formControlName="descripcion" type="email" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Navegador</mat-label>
        <input matInput formControlName="navegador" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-completo">
        <mat-label>Propietario</mat-label>
        <input matInput formControlName="propietario" appSoloLetras />
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
export class DialogoPaypal implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DialogoPaypal>);
  private readonly fb = inject(FormBuilder);
  datos = inject(MAT_DIALOG_DATA);

  formulario: FormGroup = this.fb.group({
    banco: ['', Validators.required],
    clabe: ['', Validators.required],
    descripcion: ['', Validators.email],
    navegador: [''],
    propietario: ['', Validators.required]
  });

  ngOnInit() {
    this.formulario.patchValue({
      banco: this.datos.banco || '',
      clabe: this.datos.clabe || '',
      descripcion: this.datos.descripcion || '',
      navegador: this.datos.navegador || '',
      propietario: this.datos.propietario || ''
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
