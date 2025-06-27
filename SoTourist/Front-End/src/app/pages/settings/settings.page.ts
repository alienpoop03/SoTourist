import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonBadge,
  IonButton,
} from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../../components/header/app-header.component';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ProfileIconComponent } from '../../components/profile-icon/profile-icon.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonButton,
    RouterModule,
    AppHeaderComponent,
    ProfileIconComponent,
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsPage {

  // Dati profilo utente (solo quelli effettivamente visualizzati)
  userId: string = '';
  username = '';
  email = '';
  isGuest = false;
  subscriptionPlan: string = 'Standard';

  // Stato modali
  showAboutModal = false;
  showAboutModalPrivacy = false;

  constructor(private authService: AuthService, private alertCtrl: AlertController, private router: Router) {}

  // Ricarica i dati utente e abbonamento da localStorage/backend
  private refreshProfile(): void {
    this.isGuest = !!this.authService.getUserId()?.startsWith('guest_');

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
        },
        error: () => {
          console.log('Errore nel recupero tipo abbonamento');
          this.subscriptionPlan = 'Standard';
        }
      });
    }
  }

  private popstateHandler = () => this.refreshProfile();

  ngOnInit() {
    this.refreshProfile();
    window.addEventListener('popstate', this.popstateHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('popstate', this.popstateHandler);
  }

  ionViewWillEnter(): void {
    this.refreshProfile();
  }

  // Mostra modale Info & versione
  openAbout() {
    this.showAboutModal = true;
    this.showAboutModalPrivacy = false;
  }

  // Mostra modale Privacy
  openPrivacy() {
    this.showAboutModalPrivacy = true;
    this.showAboutModal = false;
  }

  // Conferma logout
  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Vuoi davvero uscire?',
      buttons: [
        { text: 'Annulla', role: 'cancel' },
        { text: 'Logout', role: 'destructive', handler: () => this.logout() }
      ],
      cssClass: 'custom-logout-alert',
    });
    await alert.present();
  }

  // Esegue logout
  logout() {
    console.log('Logout effettuato');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // Restituisce la classe del badge in base al piano abbonamento
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
}