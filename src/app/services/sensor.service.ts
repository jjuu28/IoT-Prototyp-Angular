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

  getSensorLimits(sensorId: string, valueName: string | null, token: string): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get(`${this.apiUrl}/limits?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }

  // ✅ Grenzwerte aktualisieren (PUT /agrar/limits)
  updateSensorLimits(sensorId: string, grenzeOben: number, grenzeUnten: number, token: string | null, valueName: string): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    });

    const payload = { sensorId, grenzeOben, grenzeUnten, valueName };
    return this.http.put(`${this.apiUrl}/limits`, payload, { headers });
  }

  // ✅ Meldungen abrufen (GET /agrar/limits/meldung)
  getSensorMessages(sensorId: string, valueName: string, token: string | null): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get(`${this.apiUrl}/limits/meldung?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }

  // ✅ Meldung löschen (DELETE /agrar/limits/meldung)
  deleteSensorMessage(sensorId: string, valueName: string, token: string | null): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.delete(`${this.apiUrl}/limits/meldung?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }



}
