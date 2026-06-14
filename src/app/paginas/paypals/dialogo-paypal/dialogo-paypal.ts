import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SoloLetrasDirective } from '../../../core/directivas/solo-letras.directive';
import { SoloNumerosDirective } from '../../../core/directivas/solo-numeros.directive';

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
  templateUrl: './dialogo-paypal.html',
  styleUrl: './dialogo-paypal.scss'
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
