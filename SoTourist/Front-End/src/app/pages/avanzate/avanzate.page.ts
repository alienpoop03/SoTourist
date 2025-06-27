import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonListHeader,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { ToggleComponent } from 'src/app/components/toggle/toggle.component';

@Component({
  selector: 'app-avanzate',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonListHeader,
    IonIcon,
    IonSelect,
    IonSelectOption,
    NavigationBarComponent,
    ToggleComponent,
  ],
  templateUrl: './avanzate.page.html',
  styleUrls: ['./avanzate.page.scss']
})
export class AvanzatePage {

  // Stato locale delle preferenze
  darkMode = false;
  language: 'it' | 'en' = 'it';

  // Cambia il tema e lo salva in localStorage
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

  // Carica e applica tema scuro/chiaro
  loadDarkMode() {
    const saved = localStorage.getItem('darkMode');
    this.darkMode = saved ? JSON.parse(saved) : false;

    if (this.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  // Cambia lingua app (solo console per ora)
  changeLanguage() {
    console.log('Lingua cambiata:', this.language);
  }
}