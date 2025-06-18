import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './ip.config';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  //private baseUrl = 'http://192.168.17.185:3000/api/auth';
  private baseUrl = API_BASE_URL + '/api/auth';


  constructor(private http: HttpClient) { }

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
  saveSession(userId: string, profile: { username: string; email: string}) {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }

  getCurrentUserType(): 'guest' | 'user' {
    const userId = this.getUserId();
    if (userId && userId.startsWith('guest_')) {
      return 'guest';
    }
    return 'user';
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

  upgradeAccount(userId: string, plan: 'premium' | 'gold') {
    return this.http.post(`${this.baseUrl}/users/${userId}/upgrade`, { plan });
  }

  cancelSubscription(userId: string) {
    return this.http.post(`${this.baseUrl}/users/${userId}/cancel`, {});
  }

  getUserType(userId: string) {
    return this.http.get<{ userId: string; type: string; subscriptionEndDate: string | null }>(
      `${this.baseUrl}/users/${userId}/type`
    );
  }

  //odifica dati
  updateUser(userId: string, data: { username?: string; email?: string;}) {
    return this.http.put(`${this.baseUrl}/users/${userId}`, data);
  }

  updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const body = { currentPassword, newPassword };
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/users/${userId}/password`,
      body
    );
}


  //cancella utente
  deleteUser(userId: string) {
    return this.http.delete(`${this.baseUrl}/users/${userId}`);
  }

  updateProfileImage(userId: string, base64Image: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${userId}/profile-image`, {
      base64: base64Image
    });
  }

  getProfileImageBlob(userId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/users/${userId}/profile-image`, {
      responseType: 'blob' // 👈 Ricevi il binario
    });
  }

  getProfileImage(userId: string) {
    return this.http.get<{ base64: string }>(
      `${this.baseUrl}/users/${userId}/profile-image`
    );
  }

  getRegistrationDate(userId: string) {
    return this.http.get<{ userId: string; registrationDate: string }>(
      `${this.baseUrl}/users/${userId}/registration-date`
    );
  }
}
