import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar'; // 👈 importa il plugin

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.configureStatusBar(); // 👈 chiama la funzione all’avvio
  }

  async configureStatusBar() {
    try {
      // Setta il testo chiaro (per sfondo scuro bordeaux)
      await StatusBar.setStyle({ style: Style.Light });

      // Imposta il colore della status bar (bordeaux)
      await StatusBar.setBackgroundColor({ color: '#7B1E1E' });

      // Mostra sempre la status bar
      await StatusBar.show();

      // NON sovrapporre alla WebView
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (err) {
      console.warn('Status bar configuration skipped:', err);
    }
  }
}
