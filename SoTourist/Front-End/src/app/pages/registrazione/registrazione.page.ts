import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import * as bcrypt from 'bcryptjs';
import { ProfileIconComponent } from '../../components/profile-icon/profile-icon.component'; // <== aggiorna il path
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-registrazione',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule,
    ProfileIconComponent,
  ],
  templateUrl: './registrazione.page.html',
  styleUrls: ['./registrazione.page.scss']
})

export class RegistrazionePage {
  username = '';
  email = '';
  password = '';
  profileImageUrl: string = ''; // ✅ questa riga risolve tutto

  constructor(private auth: AuthService, private router: Router, private toastService: ToastService) {}

  async onRegister() {
      this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.toastService.showSuccess('Registrazione completata!');
        this.router.navigateByUrl('/login');
      },
      error: (err: any) => {
        console.error(err);
        this.toastService.showError('Errore nella registrazione');
      }
    });
  }

  onProfileChanged(newUrl: string) {
    this.profileImageUrl = newUrl;
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
