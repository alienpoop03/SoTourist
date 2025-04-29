import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonInput,
    IonButton
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  darkTheme = false;
  notificationsEnabled = true;
  profileImage: string | null = null;
  supportMessage = '';

  constructor() {}

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  openFilePicker() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  

  sendSupportMessage() {
    if (!this.supportMessage) {
      alert('Scrivi un messaggio di supporto!');
      return;
    }
    console.log('Messaggio inviato:', this.supportMessage);
    this.supportMessage = '';
    alert('Messaggio inviato al supporto!');
  }
}
