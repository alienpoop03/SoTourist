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
  }

  ngOnInit() {
     // 🌙 Tema scuro
    const dark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', dark);

    // 🔐 Controllo login
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } else {
      this.router.navigateByUrl('/login', { replaceUrl: true });
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
