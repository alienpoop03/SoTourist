//risveglio server
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BackendService {
  private backendAwake = false;

  wakeBackend(): Promise<void> {
    if (this.backendAwake) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⏱ Timeout: backend non risponde');
        this.backendAwake = true;
        resolve(); // ✅ risolve la promise comunque
      }, 30000);

      fetch('https://sotourist.onrender.com/api/ping')
        .then(() => {
          clearTimeout(timeout);
          console.log('✅ Backend attivo');
          this.backendAwake = true;
          resolve(); // ✅ risolve se va bene
        })
        .catch((err) => {
          console.warn('⚠️ Errore fetch:', err);
          // ❗ NON chiamare resolve qui: lasciamo gestire il timeout
        });
    });
  }
}

