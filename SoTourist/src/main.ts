import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { addIcons } from 'ionicons';
import { trashOutline, homeOutline, addCircleOutline, settingsOutline, personCircleOutline } from 'ionicons/icons';

addIcons({
  'trash-outline': trashOutline,
  'home-outline': homeOutline,
  'add-circle-outline': addCircleOutline,
  'settings-outline': settingsOutline,
  'person-circle-outline': personCircleOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
