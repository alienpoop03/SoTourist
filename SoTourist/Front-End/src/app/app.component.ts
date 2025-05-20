import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Router } from '@angular/router';
import { BackendService } from './services/backend.service';
import { GenerationOverlayComponent } from './components/generation-overlay/generation-overlay.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, GenerationOverlayComponent, CommonModule,],
})
export class AppComponent implements OnInit {
  showOverlay = true;

  constructor(
    private router: Router,
    private backend: BackendService
  ) {
    this.configureStatusBar();
  }

  async ngOnInit() {
    // ⏳ Risveglia il backend
    console.log('Inizio wakeBackend');
    await this.backend.wakeBackend();
    console.log('Backend sveglio, chiudo overlay');
    this.showOverlay = false;

    // 🌙 Tema scuro
    const dark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', dark);

    // 🔐 Controllo login
    const userId = localStorage.getItem('userId');
    const target = userId ? '/tabs/home' : '/login';

    if (this.router.url !== target) {
      this.router.navigateByUrl(target, { replaceUrl: true });
    }
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
}
