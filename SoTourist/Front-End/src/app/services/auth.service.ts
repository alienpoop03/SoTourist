import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  register(username: string, email: string, passwordHash: string) {
    return this.http.post(`${this.baseUrl}/register`, {
      username,
      email,
      password: passwordHash
    });
  }

  login(email: string, passwordHash: string) {
    return this.http.post<{ userId: string }>(`${this.baseUrl}/login`, {
      email,
      password: passwordHash
    });
  }
}
