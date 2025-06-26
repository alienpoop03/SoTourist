import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, NavigationBarComponent, IonInput, IonButton]
})
export class ChangePasswordPage implements OnInit {

  constructor( private authService: AuthService, private toastService: ToastService) { }

  userId: string = '';
  email: string = '';
  username: string = '';
  emailP: string = '';
  usernameP: string = '';
  password: string = '';
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
    this.usernameP = this.username;
    this.emailP = this.email;
  }



  saveMail(){
    this.authService.updateUser(this.userId, {
      username: this.username,
      email: this.email
    }).subscribe({
      next: (res) => {
        this.toastService.showSuccess('Dati aggiornati con successo!');
        this.authService.saveSession(this.userId, {
          username: this.username,
          email: this.email
        });
        this.usernameP = this.username;
        this.emailP = this.email;
      },
      error: (err) => {
        this.toastService.showError('Errore durante l\'aggiornamento.');
      }
    });
  }

  savePassword(){
    if(this.newPassword != '' && this.newPassword == this.confirmPassword){
      this.authService.updatePassword(this.userId, this.password, this.newPassword).subscribe({
        next: (res) => {
          this.toastService.showSuccess("Password cambiata con successo");
        },
        error: (err) => {
          this.toastService.showError("Password errata");
        }
      });
    }else{
      this.toastService.showWarning('Nuova password e conferma password non coincidono');
    }
  }

  isMailValid():boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]+$/;

    return emailPattern.test(this.email);
  }

  isPasswordValid():boolean {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passwordPattern.test(this.newPassword) && passwordPattern.test(this.confirmPassword);
  }
}
