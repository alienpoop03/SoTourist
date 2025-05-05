import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ IMPORTANTE!
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonInput
} from '@ionic/angular/standalone';
import { AppHeaderComponent } from "../components/header/app-header.component";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // ✅ QUI!
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonIcon,
    AppHeaderComponent, // ✅ Aggiunto il componente header
    IonInput,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // ✅ Consigliato per componenti Ionic standalone
})
export class SettingsPage {
  darkMode = false;
  notificationsEnabled = true;
  autoSync = false;

  username = '';
  email = '';
  password = '';
  profileImageUrl: string | null = null;

  toggleDarkMode() {
    document.body.classList.toggle('dark', this.darkMode);
  }

  toggleNotifications() {}
  toggleAutoSync() {}

  logout() {
    console.log('Logout eseguito');
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImageUrl = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  triggerFileInput() {
    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    fileInput?.click();
  }
}

