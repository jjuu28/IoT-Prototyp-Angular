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

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://node-red.studybuddy.top/agrar';

  constructor(private http: HttpClient) {
  }

  getUser(token: string | null): Observable<User> {
    if (!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get<User>(`${this.apiUrl}/user`, {headers});


  }
}
