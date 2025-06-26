import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationBarComponent } from '../../components/navigation-bar/navigation-bar.component';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonCard
} from '@ionic/angular/standalone';
import { ProfileIconComponent } from '../../components/profile-icon/profile-icon.component';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonCard,
    NavigationBarComponent,
    ProfileIconComponent
  ],
  templateUrl: './profilo.page.html',
  styleUrls: ['./profilo.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfiloPage implements OnInit {

  // Dati profilo
  userId: string = '';
  username = '';
  email = '';
  profileImageUrl: string | null = null;
  registrationDate: Date | null = null;

  // Abbonamento
  subscriptionPlan: string = 'Standard';
  subscriptionExpiry: Date | null = null;

  // Preferenze
  language: 'it' | 'en' = 'it';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.refreshProfile();
  }

  ionViewWillEnter(): void {
    this.refreshProfile();
  }

  // Carica dati da storage e backend
  private refreshProfile(): void {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      this.userId = localStorage.getItem('userId') || '';
      this.username = parsed.username || '';
      this.email = parsed.email || '';
    }

    if (this.userId) {
      this.authService.getUserType(this.userId).subscribe({
        next: (res) => {
          const type = res.type || 'standard';
          this.subscriptionPlan = type.charAt(0).toUpperCase() + type.slice(1);
          this.subscriptionExpiry = res.subscriptionEndDate ? new Date(res.subscriptionEndDate) : null;
        },
        error: () => {
          this.subscriptionPlan = 'Standard';
          this.subscriptionExpiry = null;
        }
      });

      this.authService.getRegistrationDate(this.userId).subscribe({
        next: (res) => {
          this.registrationDate = new Date(res.registrationDate);
        },
        error: () => {}
      });
    }
  }

  getBadgeClass(plan: string): string {
    switch (plan?.toLowerCase()) {
      case 'premium':
        return 'badge-premium';
      case 'gold':
        return 'badge-gold';
      case 'standard':
        return 'badge-standard';
      default:
        return 'medium';
    }
  }

  onProfileImageChanged(base64: string) {
    this.profileImageUrl = base64;
  }

  changePassword() {
    this.router.navigate(['/change-password']);
  }

  async confirmDeleteAccount() {
    const alert = await this.alertCtrl.create({
      header: 'Elimina account',
      message: 'Questa azione è irreversibile. Sei sicuro di voler procedere?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Elimina', role: 'destructive', handler: () => this.deleteAccount() }
      ]
    });

    await alert.present();
  }

  deleteAccount() {
    this.authService.deleteUser(this.userId).subscribe({
      next: () => {
        localStorage.clear();
        this.toastService.showSuccess('Account eliminato.');
        window.location.href = '/login';
      },
      error: () => {
        this.toastService.showError('Errore durante la cancellazione dell’account.');
      }
    });
  }

  goToUpgrade() {
    this.router.navigate(['/upgrade']);
  }
}