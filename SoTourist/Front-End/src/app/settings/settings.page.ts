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
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ProfileIconComponent } from '../components/profile-icon/profile-icon.component'; // 👈 importa il componente


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
    ProfileIconComponent,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsPage {
  constructor(private alertCtrl: AlertController, private router: Router) {}


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

  /* Metodi Profilo*/
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

  /*Preferenze*/
  toggleDarkMode() {
    /*document.body.classList.toggle('dark', this.darkMode);
    localStorage.setItem('darkMode', String(this.darkMode));*/
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));

    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
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

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Vuoi davvero uscire?',
      buttons: [
        {
          text: 'Annulla',
          role: 'cancel'
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: () => this.logout()
        }
      ]
    });

    await alert.present();
  }

  logout() {
   console.log('❗ Logout effettuato');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    this.router.navigate(['/login'], { replaceUrl: true });
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

  changePassword() {
    console.log('Cambia password');
  }

  openAbout() {
    console.log('Apri about');
  }

  openPrivacy() {
    console.log('Apri privacy');
  }

  ngOnInit() {
    const saved = localStorage.getItem('darkMode');
    this.darkMode = saved === 'true'; 

    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // ✅ Carica dati profilo
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      this.username = parsed.username || '';
      this.email = parsed.email || '';
    } 
  }

}
