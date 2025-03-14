import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = 'https://node-red.studybuddy.top/agrar';

  constructor(private http: HttpClient) {}

  getSensors(token: string) {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });
    return this.http.get('https://node-red.studybuddy.top/agrar/sensors', { headers });
  }

  getSensorData(sensorId: string, valueName: string, startOffset: number, endOffset: number, token: string | null): Observable<any> {
    if(!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get(`${this.apiUrl}/data?sensorId=${sensorId}&valueName=${valueName}&startOffset=${startOffset}&endOffset=${endOffset}`, { headers });
  }
}
