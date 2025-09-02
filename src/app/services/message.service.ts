import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'https://node-red.walimteam.nl/agrar';

  constructor(private http: HttpClient) {}

  getMessages(userId: string, token: string | null): Observable<any> {
    if (!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get(`${this.apiUrl}/limits/meldung?userId=${userId}`, { headers });
  }
}
