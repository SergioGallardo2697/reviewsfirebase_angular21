import { Directive, HostListener, Self } from '@angular/core';
import { EditableColumn } from 'primeng/table';

@Directive({
  selector: '[appEditarDobleClic]',
  host: {
    'class': 'p-editable-column',
    'style': 'cursor: pointer'
  }
})
export class EditarDobleClicDirective {
  constructor(@Self() private readonly celda: EditableColumn) {
    this.celda.pEditableColumnDisabled = true;
  }

  @HostListener('dblclick')
  alDobleClic() {
    this.celda.openCell();
  }
}
