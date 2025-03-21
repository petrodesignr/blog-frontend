import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/user';

  constructor(private http: HttpClient) {}

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user);
  }

  saveToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  getToken() {
    return localStorage.getItem('jwt');
  }

  logout() {
    localStorage.removeItem('jwt');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAuthorised(): boolean {
   const auth = this.getUser();
    return auth !== null && auth.role === "admin"
  }

  getUser(): { nom: string; prenom: string; role: string;} | null {
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
        return { nom: payload.nom, prenom: payload.prenom, role: payload.role }; // Adjust based on your token structure
      } catch (e) {
        console.error('Error decoding token:', e);
        return null;
      }
    }
    return null;
  }


  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/makeadmin`, { id: userId, role });
  }
  
  getAllUsers(): Observable<User[]> {
    const token = this.getToken();
    return this.http.get<User[]>(`${this.apiUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}