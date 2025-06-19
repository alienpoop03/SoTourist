import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { NoGuestGuard } from '../../guards/no-guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'itinerario',
        loadComponent: () =>
          import('../itinerario/itinerario.page').then((m) => m.ItinerarioPage),
      },
      {
        path: 'profilo',
        loadComponent: () =>
          import('../profilo/profilo.page').then((m) => m.ProfiloPage),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('../map/map.page').then(m => m.MapPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then(m => m.SettingsPage),
      },
      {
        path: 'viaggi',
        loadComponent: () =>
          import('../viaggi/viaggi.page').then((m) => m.ViaggiPage),
      },
      {
        path: 'panoramica',
        loadComponent: () =>
          import('../panoramica/panoramica.page').then(m => m.PanoramicaPage),
      },
      {
        path: 'storico-viaggi',
        loadComponent: () => import('../storico-viaggi/storico-viaggi.page').then( m => m.StoricoViaggiPage),
            canActivate: [NoGuestGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
           
    ]
  },
  {
    path: 'crea',
    loadComponent: () =>
      import('../crea/crea.page').then(m => m.CreaPage),
  },

];
