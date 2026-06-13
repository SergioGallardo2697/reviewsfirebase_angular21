import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

// Limpia en tiempo real cualquier carácter que no sea letra (con acentos/ñ) o espacio.
// Funciona en escritura, pegado y arrastrado, y es compatible con
// formularios template-driven (ngModel) y reactivos (formControlName).
@Directive({
  selector: '[appSoloLetras]'
})
export class SoloLetrasDirective {
  private readonly elemento = inject(ElementRef);
  private readonly control = inject(NgControl);

  @HostListener('input') alEscribir() { this.sanitizar(); }
  @HostListener('paste') alPegar() { setTimeout(() => this.sanitizar()); }
  @HostListener('drop') alSoltar() { setTimeout(() => this.sanitizar()); }

  private sanitizar() {
    const valor: string = this.elemento.nativeElement.value;
    const limpio = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '');
    if (limpio !== valor) {
      this.control.control?.setValue(limpio);
    }
  }
}
