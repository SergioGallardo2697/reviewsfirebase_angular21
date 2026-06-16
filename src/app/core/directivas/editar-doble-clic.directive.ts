import { Directive, Self, ElementRef, inject, OnDestroy } from '@angular/core';
import { EditableColumn } from 'primeng/table';

const MS_DOBLE_CLIC = 300;

@Directive({
  selector: '[appEditarDobleClic]',
  host: {
    'class': 'p-editable-column',
    'style': 'cursor: pointer'
  }
})
export class EditarDobleClicDirective implements OnDestroy {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private temporizador?: ReturnType<typeof setTimeout>;

  private readonly interceptarClic = (evento: Event) => {
    if (this.celda.dataTable.editingCell === this.elemento.nativeElement) {
      return;
    }
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
      return;
    }
    evento.stopImmediatePropagation();
    this.temporizador = setTimeout(() => (this.temporizador = undefined), MS_DOBLE_CLIC);
  };

  constructor(@Self() private readonly celda: EditableColumn) {
    this.elemento.nativeElement.addEventListener('click', this.interceptarClic, true);
  }

  ngOnDestroy() {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.elemento.nativeElement.removeEventListener('click', this.interceptarClic, true);
  }
}
