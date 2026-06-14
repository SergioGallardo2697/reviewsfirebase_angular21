import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

// Permite solo dígitos y un punto decimal (ej: "123.45").
// Impide múltiples puntos y cualquier carácter no numérico.
@Directive({
  selector: '[appSoloDecimales]'
})
export class SoloDecimalesDirective {
  private readonly elemento = inject(ElementRef);
  private readonly control = inject(NgControl);

  @HostListener('input') alEscribir() { this.sanitizar(); }
  @HostListener('paste') alPegar() { setTimeout(() => this.sanitizar()); }
  @HostListener('drop') alSoltar() { setTimeout(() => this.sanitizar()); }

  private sanitizar() {
    const valor: string = this.elemento.nativeElement.value;
    let limpio = valor.replace(/[^0-9.]/g, '');
    // Permitir solo un punto decimal
    const partes = limpio.split('.');
    if (partes.length > 2) {
      limpio = partes[0] + '.' + partes.slice(1).join('');
    }
    if (limpio !== valor) {
      this.control.control?.setValue(limpio);
    }
  }
}
