import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Interface für Sensordaten
interface SensorData {
  value: number;
  unit: string;
  valueName: string;
  fieldName?: string;
  ident: string;
  timestamp?: string;
  sensorId?: string;
}

// Interface für die Antwort von getSensorData und getLastData
interface SensorDataResponse {
  timestamps: string[];
  values: number[];
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = 'https://node-red.studybuddy.top/agrar';

  constructor(private http: HttpClient) {}

  getSensors(token: string): Observable<SensorData[]> {
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });
    return this.http.get<SensorData[]>('https://node-red.studybuddy.top/agrar/sensors', { headers });
  }

  getSensorData(sensorId: string, valueName: string, startOffset: number, endOffset: number, token: string | null): Observable<SensorDataResponse> {
    if (!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get<SensorDataResponse>(`${this.apiUrl}/data?sensorId=${sensorId}&valueName=${valueName}&startOffset=${startOffset}&endOffset=${endOffset}`, { headers });
  }

  getLastData(sensorId: string, valueName: string, minutesAgo: number | null, token: string | null): Observable<SensorDataResponse> {
    if (!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    if (minutesAgo === null) {
      return this.http.get<SensorDataResponse>(`${this.apiUrl}/data/last?sensorId=${sensorId}&valueName=${valueName}`, { headers });
    }

    // minutesAgo in Stunden umrechnen (z. B. 15 Minuten = 0.25 Stunden)
    const hoursAgo = -(minutesAgo / 60);
    return this.http.get<SensorDataResponse>(`${this.apiUrl}/data/last?sensorId=${sensorId}&valueName=${valueName}&hoursAgo=${hoursAgo}`, { headers });
  }

  getLastDataFifteen(sensorId: string, valueName: string, token: string | null): Observable<SensorDataResponse> {
    if (!token) {
      return new Observable();
    }

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get<SensorDataResponse>(`${this.apiUrl}/data/last/fifteen?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }

  getSensorLimits(sensorId: string, valueName: string | null, token: string): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get(`${this.apiUrl}/limits?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }

  updateSensorLimits(sensorId: string, grenzeOben: number, grenzeUnten: number, token: string | null, valueName: string): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    });

    const payload = { sensorId, grenzeOben, grenzeUnten, valueName };
    return this.http.put(`${this.apiUrl}/limits`, payload, { headers });
  }

  getSensorMessages(sensorId: string, valueName: string, token: string | null): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get(`${this.apiUrl}/limits/meldung?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }

  deleteSensorMessage(sensorId: string, valueName: string, token: string | null): Observable<any> {
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.delete(`${this.apiUrl}/limits/meldung?sensorId=${sensorId}&valueName=${valueName}`, { headers });
  }
}
