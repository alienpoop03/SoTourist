import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-modifica-date',
  templateUrl: './modifica-date.page.html',
  styleUrls: ['./modifica-date.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ModificaDatePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
