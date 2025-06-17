import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Router } from '@angular/router';
import { GenerationOverlayComponent } from './components/generation-overlay/generation-overlay.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { catchError, of } from 'rxjs';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, GenerationOverlayComponent, CommonModule,],
})
export class AppComponent implements OnInit {
  showOverlay = true;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    this.configureStatusBar();
  }

  async ngOnInit() {
   /* // ⏳ Risveglia il backend
    console.log('Inizio wakeBackend');
    await this.backend.wakeBackend();
    console.log('Backend sveglio, chiudo overlay');
    this.showOverlay = false;*/

    // 🌙 Tema scuro
    const dark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', dark);

    // 🔐 Controllo login
    const userId = localStorage.getItem('userId');

    // 🧠 Controlla se è un refresh
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const isRefresh = navEntry?.type === 'reload';

    if (!userId) {
      this.goToLogin();
      return;
    }

    if (isRefresh) {
      return; // 🔄 Non fare nulla su refresh
    }

    if (userId.startsWith('guest_')) {
      this.goToHome();
      return;
    }

    // ✅ Controllo reale utente
    this.auth.getUserType(userId).pipe(
      catchError(err => {
        console.error('Errore nel controllo utente:', err);
        localStorage.removeItem('userId');
        this.goToLogin();
        return of(null);
      })
    ).subscribe((res: any) => {
      if (res) {
        this.goToHome();
      } else {
        localStorage.removeItem('userId');
        this.goToLogin();
      }
    });
  }

  async configureStatusBar() {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#7B1E1E' });
      await StatusBar.show();
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (err) {
      console.warn('Status bar configuration skipped:', err);
    }
  }

  goToLogin() {
    this.showOverlay = false;
    if (this.router.url !== '/login') {
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  goToHome() {
    this.showOverlay = false;
    if (this.router.url !== '/tabs/home') {
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    }
  }
}

