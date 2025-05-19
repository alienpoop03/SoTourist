import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar'; // 👈 importa il plugin
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  
  constructor(private router: Router) {
    this.configureStatusBar(); // 👈 resta qui
    this.wakeUpBackend();
  }

  ngOnInit() {
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

  wakeUpBackend() {
    fetch('https://sotourist.onrender.com/api/ping')
      .then(() => console.log('✅ Backend svegliato'))
      .catch(err => console.warn('⚠️ Backend in avvio:', err));
  }
  
}
