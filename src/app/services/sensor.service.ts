import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = 'https://node-red.studybuddy.top/agrar';

  constructor(private http: HttpClient) {}

  getSensors(authToken: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${authToken}`);
    return this.http.get(`${this.apiUrl}/sensors`, { headers });
  }

  getSensorData(sensorId: string, valueName: string, startOffset: number, endOffset: number): Observable<any> {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${authToken}`);
    return this.http.get(`${this.apiUrl}/data?sensorId=${sensorId}&valueName=${valueName}&startOffset=${startOffset}&endOffset=${endOffset}`, { headers });
  }
}
