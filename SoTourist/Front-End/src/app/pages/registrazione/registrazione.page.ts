import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-registrazione',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  templateUrl: './registrazione.page.html',
  styleUrls: ['./registrazione.page.scss']
})
export class RegistrazionePage {
  username = '';
  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // Gestisce la registrazione utente
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

  // Controlla la validità del form
  isFormValid(): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]+$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    return (
      this.username.trim().length > 0 &&
      emailPattern.test(this.email) &&
      passwordPattern.test(this.password)
    );
  }

  // Vai alla pagina di login
  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}