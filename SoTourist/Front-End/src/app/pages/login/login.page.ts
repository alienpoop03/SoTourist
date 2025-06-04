import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

import {
  IonContent,

  IonInput,
  IonButton,

} from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../../components/header/app-header.component';
import { ProfileIconComponent } from '../../components/profile-icon/profile-icon.component'; // 👈 importa il componente
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    
    IonInput,
    
    IonButton,
   
    IonContent,

    CommonModule,
    FormsModule,
    ProfileIconComponent,
  ]
})
export class LoginPage implements OnInit {

  constructor(private auth: AuthService, private router: Router, private toastService: ToastService) {}

  
  //username: string = '';
  email: string = '';
  password: string = ''
  profileImageUrl: string | null = null;

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = e => (this.profileImageUrl = (e.target as any).result);
      reader.readAsDataURL(input.files[0]);
    }
  }

  triggerFileInput() {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }

  async saveProfile() {
    if (!this.email || !this.password) {
      this.toastService.showWarning('Inserisci email e password');
      return;
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = bcrypt.hashSync(this.password, 10);

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.saveSession(res.userId, {
          username: res.username,
          email: this.email
        });
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


  goToRegister() {
    this.router.navigateByUrl('/registrazione');
  }

  loginAsGuest() {
    const guestId = 'guest_' + Date.now();
    this.auth.saveSession(guestId, {
      username: 'Ospite',
      email: 'ospite@sotourist.app'
    });
    const redirect = localStorage.getItem('redirectAfterLogin');
    if (redirect) {
      localStorage.removeItem('redirectAfterLogin');
      this.router.navigateByUrl(redirect);
    } else {
      this.router.navigate(['/tabs/home']);
    }
  }


  ngOnInit() {
  }

}
