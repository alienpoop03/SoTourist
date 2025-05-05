import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-custom-sidebar',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './custom-sidebar.component.html',
  styleUrls: ['./custom-sidebar.component.scss'],
})
export class CustomSidebarComponent {
  logout() {
    console.log('Logout cliccato');
    // Logica reale di logout (es. rimozione token, redirect, ecc.)
  }
}
