import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar'; // 👈 importa il plugin

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  
  constructor() {
    this.configureStatusBar(); // 👈 resta qui
  }

  ngOnInit() {
    const dark = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark', dark);
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
