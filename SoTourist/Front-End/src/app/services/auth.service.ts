import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './ip.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  //private baseUrl = 'http://192.168.17.185:3000/api/auth';
    private baseUrl = API_BASE_URL+'/api/auth';


  constructor(private http: HttpClient) {}

  register(username: string, email: string, password: string) {
    return this.http.post(`${this.baseUrl}/register`, {
      username,
      email,
      password
    });
  }

  login(email: string, password: string) {
    return this.http.post<{ userId: string, username: string, type: string }>(
      `${this.baseUrl}/login`,
      { email, password }
    );
  }

  
  // 💾 Salva info utente localmente
  saveSession(userId: string, profile: { username: string; email: string }) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  // 🔐 Logout
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
  }

  // 📤 Leggi ID utente
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // 📤 Leggi profilo utente
  getUserProfile(): { username: string; email: string } | null {
    const raw = localStorage.getItem('userProfile');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getUserId();
  }

}
