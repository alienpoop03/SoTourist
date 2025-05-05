import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ IMPORTANTE!
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon
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
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // ✅ Consigliato per componenti Ionic standalone
})
export class SettingsPage {
  username = 'Utente'; // ✅ AGGIUNTA QUI
  darkMode = false;
  notificationsEnabled = true;
  autoSync = false;

  toggleDarkMode() {
    document.body.classList.toggle('dark', this.darkMode);
  }

  toggleNotifications() {
    console.log('Notifiche:', this.notificationsEnabled);
  }

  toggleAutoSync() {
    console.log('Auto-sync:', this.autoSync);
  }

  logout() {
    console.log('Logout eseguito');
  }
}
