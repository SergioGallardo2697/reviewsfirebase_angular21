import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

// Limpia en tiempo real cualquier carácter no numérico.
// Funciona en escritura, pegado y arrastrado, y es compatible con
// formularios template-driven (ngModel) y reactivos (formControlName).
@Directive({
  selector: '[appSoloNumeros]'
})
export class SoloNumerosDirective {
  private readonly elemento = inject(ElementRef);
  private readonly control = inject(NgControl);

  @HostListener('input') alEscribir() { this.sanitizar(); }
  @HostListener('paste') alPegar() { setTimeout(() => this.sanitizar()); }
  @HostListener('drop') alSoltar() { setTimeout(() => this.sanitizar()); }

  private sanitizar() {
    const valor: string = this.elemento.nativeElement.value;
    const limpio = valor.replace(/\D/g, '');
    if (limpio !== valor) {
      this.control.control?.setValue(limpio);
    }
  }
}
