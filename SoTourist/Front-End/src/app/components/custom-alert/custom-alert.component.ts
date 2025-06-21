import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.scss'],
})


export class CustomAlertComponent {
  @Input() alertTitle: string = 'Attenzione';
  @Input() alertMessage: string = 'Sei sicuro di voler procedere?';
  @Input() cancelText: string = 'Annulla';
  @Input() confirmText: string = 'Conferma';

  @Input() isVisible: boolean = false; // Controlla la visibilità dell'alert
  @Output() confirm = new EventEmitter<void>(); // Quando si conferma
  @Output() cancel = new EventEmitter<void>(); // Quando si annulla

  // Funzione per chiudere l'alert
  closeAlert() {
    this.isVisible = false;
    this.cancel.emit();
  }

  // Funzione per confermare l'alert
  confirmAlert() {
    this.isVisible = false;
    this.confirm.emit();
  }
}
