import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle
  ],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent {
  @Input() box_shadow: boolean = false;
  @Input() title: string = '';
  @Input() showBackButton: boolean = false;
  @Input() iconName: string = 'earth-outline';

  constructor(private router: Router) {}

  NavHome() {
    this.router.navigate(['/tabs/home']);
  }
}