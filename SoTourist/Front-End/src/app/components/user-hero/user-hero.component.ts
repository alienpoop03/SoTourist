import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { ProfileIconComponent } from '../profile-icon/profile-icon.component';

@Component({
  selector: 'app-user-hero',
  standalone: true,
  imports: [CommonModule, IonIcon, ProfileIconComponent],
  templateUrl: './user-hero.component.html',
  styleUrls: ['./user-hero.component.scss']
})
export class UserHeroComponent implements OnInit {
  @Input() userId: string = '';
  @Input() username: string = 'Nuovo utente';
  @Input() upcomingCount: number = 0;
  @Input() pastCount: number = 0;
  @Input() visitedPlacesCount: number = 0;

  constructor() {}

  ngOnInit() {}
}