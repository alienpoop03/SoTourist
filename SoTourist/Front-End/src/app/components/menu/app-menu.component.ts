import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterModule,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss']
})
export class AppMenuComponent {
  constructor(private menuCtrl: MenuController) {}

  logout() {
    console.log('Logout cliccato');
    this.menuCtrl.close(); // Chiude il menu
  }
}
