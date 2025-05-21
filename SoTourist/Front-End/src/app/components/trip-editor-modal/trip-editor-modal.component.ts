import { Component, Input, CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  IonTextarea,
  IonButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonChip
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common'; // ⬅️ aggiungi questo!
import { FormsModule } from '@angular/forms'; // ⬅️ QUESTO È FONDAMENTALE


@Component({
  selector: 'app-trip-editor-modal',
  standalone: true,
  imports: [
    IonTextarea, IonButton, IonLabel, IonSelect, IonSelectOption, IonChip,CommonModule,FormsModule,
  ],
  templateUrl: './trip-editor-modal.component.html',
  styleUrls: ['./trip-editor-modal.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA] // ⬅️ AGGIUNGI QUESTO!

})
export class TripEditorModalComponent {
  @Input() mode: 'mustSee' | 'eat' | 'visited' | 'transport' | 'ai' = 'mustSee';
  @Input() initialValue: string = '';
  @Input() selectedDays: number[] = [];

  value: string = '';

  ngOnInit() {
    this.value = this.initialValue;
  }

  dismiss() {
    this.modalCtrl.dismiss(this.value);
  }

  cancel() {
    this.modalCtrl.dismiss(); // Nessun valore = annulla
  }

  constructor(private modalCtrl: ModalController) {}
}
