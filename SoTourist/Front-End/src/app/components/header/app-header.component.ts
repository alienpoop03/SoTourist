import { Component, Input } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonMenuButton,
  IonTitle
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonMenuButton,
    IonTitle
  ],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent {
  @Input() title: string = '';
  @Input() showBackButton: boolean = false;
  @Input() iconName: string = 'earth-outline';
}
