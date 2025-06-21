import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.scss'],
})
export class CustomAlertComponent {
  // Input per i testi dinamici
  @Input() alertTitle: string = 'Elimina account';
  @Input() alertMessage: string = 'Sei davvero sicuro?';
  @Input() cancelText: string = 'Annulla';
  @Input() confirmText: string = 'Elimina';

  // Output per notificare la selezione del pulsante
  @Output() confirmDelete = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor() {}

  confirm() {
    this.confirmDelete.emit();
  }

  cancelAlert() {
    this.cancel.emit();
  }
}