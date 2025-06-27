import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private history: string[] = [];

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.history.push(e.urlAfterRedirects);
      });
  }

  // Torna alla pagina precedente o fallback
  back(fallback: string): void {
    this.history.pop();
    const previous = this.history.pop();
    if (previous) {
      this.router.navigateByUrl(previous);
    } else {
      this.router.navigate([fallback]);
    }
  }
}