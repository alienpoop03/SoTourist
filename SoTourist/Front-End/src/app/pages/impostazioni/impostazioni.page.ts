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
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { ToggleComponent } from 'src/app/components/toggle/toggle.component';

@Component({
  selector: 'app-impostazioni',
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
    IonSelect,
    IonSelectOption,
    NavigationBarComponent,
    ToggleComponent,
  ],
  templateUrl: './impostazioni.page.html',
  styleUrls: ['./impostazioni.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImpostazioniPage {
  // Stato locale delle preferenze
  darkMode = false;
  notificationsEnabled = true;
  autoSync = false;
  language: 'it' | 'en' = 'it';
  lastSync: Date | null = null;

  toggleDarkMode() {
    localStorage.setItem('darkMode', JSON.stringify(this.darkMode));
    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  ngOnInit() {
    this.loadDarkMode();
  }

  loadDarkMode() {
    const saved = localStorage.getItem('darkMode');
    this.darkMode = saved ? JSON.parse(saved) : false;

    // Applica il tema attuale al caricamento
    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  toggleNotifications() {
    // Qui puoi mettere logica reale
    console.log('Notifiche:', this.notificationsEnabled);
  }

  toggleAutoSync() {
    // Logica per autosync
    console.log('AutoSync:', this.autoSync);
  }

  changeLanguage() {
    // Cambia lingua app
    console.log('Lingua cambiata:', this.language);
  }

  manualSync() {
    this.lastSync = new Date();
    console.log('Sincronizzazione manuale eseguita');
  }
}