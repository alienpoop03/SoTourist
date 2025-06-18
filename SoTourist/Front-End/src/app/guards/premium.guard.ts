import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PremiumGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const userId = this.auth.getUserId(); // oppure recupera da localStorage/sessione

    if (!userId) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const response = await firstValueFrom(this.auth.getUserType(userId));
      const userType = response.type;

      if (['premium', 'gold'].includes(userType)) {
        return true;
      }

      this.router.navigate(['/upgrade']);
      return false;
    } catch (error) {
      console.error('Errore durante la verifica del tipo utente:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
