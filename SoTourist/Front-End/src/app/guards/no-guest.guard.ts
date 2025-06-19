
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';  // <-- assicurati che il path sia giusto
import { Observable } from 'rxjs';
import { ToastService } from '../services/toast.service';

@Injectable({
  providedIn: 'root',
})

export class NoGuestGuard implements CanActivate{
   constructor(private authService: AuthService, private router: Router, private toastService: ToastService) {}

  canActivate(): boolean | UrlTree {
    const userType = this.authService.getCurrentUserType();  // es: 'guest', 'standard', 'premium'

    if (userType === 'guest') {
      this.toastService.showWarning("Login richiesto");
      return this.router.parseUrl('/login');
    }

    return true;
  }
};
