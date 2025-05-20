import { Component, EventEmitter, Output } from '@angular/core';
import { IonicModule, ModalController, IonInput, IonButton, IonItem, IonLabel, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-edit-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Modifica profilo</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="close()">Chiudi</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Username</ion-label>
        <ion-input [(ngModel)]="username"></ion-input>
      </ion-item>
      <ion-item>
        <ion-label position="floating">Password</ion-label>
        <ion-input type="password" [(ngModel)]="password"></ion-input>
      </ion-item>
      <ion-button expand="block" (click)="save()">Salva</ion-button>
    </ion-content>
  `
})
export class ProfileEditModalComponent {
  username = '';
  password = '';

  @Output() saveData = new EventEmitter<{ username: string; password: string }>();

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }

  save() {
    this.saveData.emit({ username: this.username, password: this.password });
    this.modalCtrl.dismiss({ username: this.username, password: this.password });
  }
}