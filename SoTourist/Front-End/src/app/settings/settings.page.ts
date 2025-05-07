import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonInput,
  IonBadge,
  IonButton,
  IonAlert,
  IonAvatar,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/header/app-header.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonIcon,
    IonInput,
    IonBadge,
    IonButton,
    IonAlert,
    IonAvatar,
    AppHeaderComponent,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsPage {
  /* profilo */
  username = '';
  email = '';
  password = '';
  profileImageUrl: string | null = null;
  editing = false;

  /* preferenze */
  darkMode = false;
  notificationsEnabled = true;
  autoSync = false;
  language: 'it' | 'en' = 'it';
  lastSync: Date | null = null;

  /* ---------- Metodi Profilo ---------- */
  saveProfile() {
    this.editing = false;
    console.log('Profilo salvato', {
      username: this.username,
      email: this.email,
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = e => (this.profileImageUrl = (e.target as any).result);
      reader.readAsDataURL(input.files[0]);
    }
  }

  triggerFileInput() {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }

  /* ---------- Preferenze ---------- */
  toggleDarkMode() {
    document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('darkMode', String(this.darkMode));
  }

  toggleNotifications() {
    console.log('Notifiche:', this.notificationsEnabled);
  }

  toggleAutoSync() {
    console.log('AutoSync:', this.autoSync);
  }

  changeLanguage() {
    console.log('Lingua cambiata:', this.language);
  }

  manualSync() {
    this.lastSync = new Date();
    console.log('Sincronizzazione manuale eseguita');
  }

  /* ---------- Sicurezza / App ---------- */
  async confirmLogout() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Logout';
    alert.message = 'Vuoi davvero uscire?';
    alert.buttons = [
      { text: 'Annulla', role: 'cancel' },
      { text: 'Logout', role: 'destructive', handler: () => this.logout() },
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  logout() {
    console.log('❗ Logout effettuato');
    // qui: pulisci storage / naviga alla login page
  }

  async confirmDeleteAccount() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Elimina account';
    alert.message =
      'Questa azione è irreversibile. Sei sicuro di voler procedere?';
    alert.buttons = [
      { text: 'Annulla', role: 'cancel' },
      {
        text: 'Elimina',
        role: 'destructive',
        handler: () => console.log('❗ Account eliminato'),
      },
    ];
    document.body.appendChild(alert);
    await alert.present();
  }

  /* placeholder */
  changePassword() {
    console.log('Cambia password');
  }

  openAbout() {
    console.log('Apri about');
  }

  openPrivacy() {
    console.log('Apri privacy');
  }
}
