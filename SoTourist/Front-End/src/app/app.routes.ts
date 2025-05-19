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
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registrazione',
    loadComponent: () => import('./registrazione/registrazione.page').then( m => m.RegistrazionePage)
  },  {
    path: 'upgrade',
    loadComponent: () => import('./upgrade/upgrade.page').then( m => m.UpgradePage)
  },
  {
    path: 'impostazioni',
    loadComponent: () => import('./impostazioni/impostazioni.page').then( m => m.ImpostazioniPage)
  },

];
