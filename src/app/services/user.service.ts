import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface für Benutzerdaten
interface User {
  firstname: string;
  lastname: string;
  email: string;
  [key: string]: any; // Für zusätzliche Felder, die von der API gesendet werden
}

// Interface für Registrierungsanfrage
interface RegisterRequest {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

// Interface für Registrierungsantwort
interface RegisterResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://node-red.studybuddy.top/agrar';

  constructor(private http: HttpClient) {}

  // Funktion zur Generierung einer zufälligen userId
  generateUserId(): string {
    return 'user-' + Math.random().toString(36).substr(2, 9);
  }

  getUser(token: string | null): Observable<User> {
    if (!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + token
    });

    return this.http.get<User>(`${this.apiUrl}/user`, { headers });
  }

  registerUser(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }
}
