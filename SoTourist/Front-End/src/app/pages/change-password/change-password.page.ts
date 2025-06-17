import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';


@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, NavigationBarComponent, IonInput, IonButton]
})
export class ChangePasswordPage implements OnInit {

  constructor() { }

  email: string = '';
  password: string = '';
  userId: string = '';
  username: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  ngOnInit() {
    this.refreshAccount();
  }

  ionViewWillEnter(): void {
    this.refreshAccount();  
  }

  private refreshAccount(): void {
     // Carica dati profilo da localStorage (come in settings)
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      this.userId = localStorage.getItem('userId') || '';
      this.username = parsed.username || '';
      this.email = parsed.email || '';
    }
  }



  saveMail(){
    // salve mail 
  }

  savePassword(){
    //salva
  }





}
