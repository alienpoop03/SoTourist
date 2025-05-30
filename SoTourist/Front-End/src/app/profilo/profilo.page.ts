import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationBarComponent } from '../components/navigation-bar/navigation-bar.component';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonCard,
} from '@ionic/angular/standalone';
import { AppHeaderComponent } from '../components/header/app-header.component';
import { ProfileIconComponent } from '../components/profile-icon/profile-icon.component';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonBadge,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonCard,
    AppHeaderComponent,
    NavigationBarComponent,
    ProfileIconComponent
  ],
  templateUrl: './profilo.page.html',
  styleUrls: ['./profilo.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfiloPage {
  // Dati profilo
  userId: string = '';
  username = '';
  email = '';
  password = '';
  profileImageUrl: string | null = null;
  registrationDate: Date = new Date(); // O caricala da backend/localStorage
  accountStatus: string = 'Standard';
  editing = false;


  // Abbonamento
  subscriptionPlan: string = 'Standard'; // o 'Premium'
  subscriptionExpiry: Date | null = null;

  // Preferenze
  notificationsEnabled = true;
  language: 'it' | 'en' = 'it';

  // Viaggi salvati
  savedTrips: any[] = [];

  constructor(  private authService: AuthService, private toastService: ToastService, private router: Router) {}

  ngOnInit() {
    // Carica dati profilo da localStorage (come in settings)
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
       this.userId = localStorage.getItem('userId') || '';
      this.username = parsed.username || '';
      this.email = parsed.email || '';
    }

    // Carica viaggi
    const trips = localStorage.getItem('trips');
    this.savedTrips = trips ? JSON.parse(trips) : [];
  
    if (this.userId) {
      this.authService.getUserType(this.userId).subscribe({
        next: (res) => {
          const type = res.type || 'standard';
          this.subscriptionPlan = type.charAt(0).toUpperCase() + type.slice(1); // Capitalizza la prima lettera
          this.subscriptionExpiry = res.subscriptionEndDate ? new Date(res.subscriptionEndDate) : null;
        },
        error: (err) => {
          console.error('Errore nel recupero tipo abbonamento:', err);
          this.subscriptionPlan = 'Standard';
          this.subscriptionExpiry = null;
        }
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



  // Modifica profilo (solo frontend)
  saveProfile() {
    this.editing = false;
    localStorage.setItem(
      'userProfile',
      JSON.stringify({ username: this.username, email: this.email })
    );
  }

  // Cambia avatar
  triggerFileInput() {
    document.querySelector<HTMLInputElement>('input[type=file]')?.click();
  }
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = e => (this.profileImageUrl = (e.target as any).result);
      reader.readAsDataURL(input.files[0]);
    }
  }

  toggleNotifications() {
    // Metti logica se serve
  }
  changeLanguage() {
    // Metti logica se serve
  }

  // Sicurezza
  changePassword() {
    // Implementa la logica reale o apri una modale
  }
  confirmDeleteAccount() {
    // Mostra alert di conferma, poi chiama deleteAccount()
    if (confirm('Sei sicuro di voler eliminare il tuo account?')) {
      this.deleteAccount();
    }
  }
  deleteAccount() {
    /*localStorage.clear();
    window.location.href = '/login';*/

    this.authService.deleteUser(this.userId).subscribe({
      next: () => {
        localStorage.clear();
        this.toastService.showSuccess('Account eliminato.');
        window.location.href = '/login';
      },
      error: (err) => {
        console.error('Errore nella cancellazione:', err);
        this.toastService.showError('❌ Errore durante la cancellazione dell’account.');
      }
    });
  }

  // Abbonamento
  upgradeSubscription() {
    // Implementa upgrade reale
    this.subscriptionPlan = 'Premium';
    this.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  manageSubscription() {
    // Implementa gestione reale
  }

  // Viaggi
  openTrip(trip: any) {
    // Vai alla pagina del viaggio
  }
  // Logout
  confirmLogout() {
    if (confirm('Vuoi uscire dall\'account?')) {
      this.logout();
    }
  }
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    window.location.href = '/login';
  }

  onProfileImageChanged(base64: string) {
    console.log('Nuova immagine:', base64);
    this.profileImageUrl = base64;
  }

    goToUpgrade() {
    this.router.navigate(['/upgrade']);
  }

}