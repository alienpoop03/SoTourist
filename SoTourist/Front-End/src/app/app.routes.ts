import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'itinerario',
    loadComponent: () => import('./itinerario/itinerario.page').then( m => m.ItinerarioPage)
  },
  {
    path: 'profilo',
    loadComponent: () => import('./profilo/profilo.page').then( m => m.ProfiloPage)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./onboarding/onboarding.page').then( m => m.OnboardingPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'map',
    loadComponent: () => import('./map/map.page').then( m => m.MapPage)
  },
  {
    path: 'viaggi',
    loadComponent: () => import('./viaggi/viaggi.page').then( m => m.ViaggiPage)
  },

];
