import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {catchError, Observable, tap, throwError} from 'rxjs';


interface User {
  firstname: string;
  lastname: string;
  email: string;
}


interface RegisterRequest {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}


interface RegisterResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://node-red.walimteam.nl/agrar';

  constructor(private http: HttpClient) {}


  generateUserId(): string {
    return 'user-' + Math.random().toString(36).substr(2, 9);
  }

  getUser(token: string | null): Observable<any> {
    if (!token) {
      console.error('Kein Token angegeben für getUser');
      return throwError(() => new Error('Kein Authentifizierungstoken vorhanden'));
    }

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + token
    });

    console.log('Sende Anfrage an:', `${this.apiUrl}/user`, 'mit Token:', token);

    return this.http.get<any>(`${this.apiUrl}/user`, { headers }).pipe(
      tap(response => console.log('Antwort von getUser:', response)),
      catchError(error => {
        console.error('Fehler in getUser:', error);
        return throwError(() => error);
      })
    );
  }

  registerUser(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }
}
