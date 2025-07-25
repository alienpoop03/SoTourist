import { Routes } from '@angular/router';
import { NoGuestGuard } from './guards/no-guest.guard';
import { GoldGuard } from './guards/gold.guard'; 

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'itinerario',
    loadComponent: () => import('./pages/itinerario/itinerario.page').then(m => m.ItinerarioPage)
  },
  {
    path: 'profilo',
    loadComponent: () => import('./pages/profilo/profilo.page').then(m => m.ProfiloPage),
    canActivate: [NoGuestGuard]
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.page').then(m => m.MapPage)
  },
  {
    path: 'viaggi',
    loadComponent: () => import('./pages/viaggi/viaggi.page').then(m => m.ViaggiPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'registrazione',
    loadComponent: () => import('./pages/registrazione/registrazione.page').then(m => m.RegistrazionePage)
  },
  {
    path: 'upgrade',
    loadComponent: () => import('./pages/upgrade/upgrade.page').then(m => m.UpgradePage),
    canActivate: [NoGuestGuard]
  },
  {
    path: 'avanzate',
    loadComponent: () => import('./pages/avanzate/avanzate.page').then(m => m.AvanzatePage)
  },
  {
    path: 'modifica-date',
    loadComponent: () => import('./pages/modifica-date/modifica-date.page').then(m => m.ModificaDatePage)
  },
  {
    path: 'personalizzazione',
    loadComponent: () => import('./pages/personalizzazione/personalizzazione.page').then(m => m.PersonalizzazionePage),
    canActivate: [GoldGuard]
  },
  {
    path: 'panoramica',
    loadComponent: () => import('./pages/panoramica/panoramica.page').then(m => m.PanoramicaPage)
  },
  {
    path: 'storico-viaggi',
    loadComponent: () => import('./pages/storico-viaggi/storico-viaggi.page').then(m => m.StoricoViaggiPage),
    canActivate: [NoGuestGuard]
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/change-password/change-password.page').then( m => m.ChangePasswordPage),
    canActivate: [NoGuestGuard]
  }

];
