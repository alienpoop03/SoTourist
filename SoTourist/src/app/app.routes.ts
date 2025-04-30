import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
      },
      {
        path: 'crea',
        loadComponent: () => import('./crea/crea.page').then(m => m.CreaPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage),
      },
      {
        path: 'itinerario',
        loadComponent: () =>
          import('./itinerario/itinerario.page').then(m => m.ItinerarioPage),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./map/map.page').then(m => m.MapPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      }
    ]
  },
  {
    path: 'crea',
    loadComponent: () => import('./crea/crea.page').then( m => m.CreaPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'itinerario',
    loadComponent: () => import('./itinerario/itinerario.page').then( m => m.ItinerarioPage)
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map.page').then( m => m.MapPage)
  }
];
