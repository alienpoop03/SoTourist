import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  //private baseUrl = 'http://192.168.17.185:3000/api/auth';
    private baseUrl = 'http://localhost:3000/api/auth';


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
}
