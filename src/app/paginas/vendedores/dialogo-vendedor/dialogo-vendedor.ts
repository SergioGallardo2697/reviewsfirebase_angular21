import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SoloLetrasDirective } from '../../../core/directivas/solo-letras.directive';
import { SoloNumerosDirective } from '../../../core/directivas/solo-numeros.directive';

// Datos que recibe y devuelve el diálogo
export interface DatosDialogoVendedor {
  nombre: string;
  facebook: string;
  whatsapp: string;
  editando: boolean;
}

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
  templateUrl: './dialogo-vendedor.html',
  styleUrl: './dialogo-vendedor.scss'
})
export class DialogoVendedor implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DialogoVendedor>);
  private readonly fb = inject(FormBuilder);
  datos = inject<DatosDialogoVendedor>(MAT_DIALOG_DATA);

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
