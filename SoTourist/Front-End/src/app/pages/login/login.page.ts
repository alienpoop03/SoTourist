import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonInput,
    IonButton
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // dati di input
  email: string = '';
  password: string = '';

  @ViewChild('passwordInput', { static: false }) passwordInputRef!: IonInput;

  ngOnInit() {
    // nulla da inizializzare
  }

  // focus sul campo password dopo invio su email
  focusPassword() {
    if (this.passwordInputRef) {
      this.passwordInputRef.getInputElement().then(input => input?.focus());
    }
  }

  // invoca login su invio nella password
  triggerLogin() {
    if (this.email && this.password) {
      this.saveProfile();
    }
  }

  // salva sessione o mostra errore
  async saveProfile() {
    if (!this.email || !this.password) {
      this.toastService.showWarning('Inserisci email e password');
      return;
    }

    const bcrypt = await import('bcryptjs');
    bcrypt.hashSync(this.password, 10);

    this.auth.login(this.email, this.password).subscribe({
      next: res => {
        this.auth.saveSession(res.userId, { username: res.username, email: this.email });
        const redirect = localStorage.getItem('redirectAfterLogin');
        if (redirect) {
          localStorage.removeItem('redirectAfterLogin');
          this.router.navigateByUrl(redirect);
        } else {
          this.router.navigate(['/tabs/home']);
        }
      },
      error: () => {
        this.toastService.showWarning('Credenziali non valide');
      }
    });
  }

  // naviga a registrazione
  goToRegister() {
    this.router.navigateByUrl('/registrazione');
  }

  // login come ospite
  loginAsGuest() {
    const guestId = 'guest_' + Date.now();
    this.auth.saveSession(guestId, { username: 'Ospite', email: '' });
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (redirect) {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigateByUrl(redirect);
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }
}