import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private apiUrl = 'https://node-red.studybuddy.top/agrar';

  constructor(private http: HttpClient) {}

 /* getSensors(token: string): Observable<any> {
    // Schritt 1: Header-Objekt erstellen
    //token = "test";
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    // Schritt 2: GET-Request mit diesem Header
    return this.http.get(`${this.apiUrl}/sensors`, { headers });
  }*/

  getSensors(token: string) {
    // Chunks definieren, hier nur als Beispiel:
    // Du kannst natürlich mehr als 3 Chunks benutzen oder andere Längen.

  const chunkSize = token.indexOf('.');
  const part1 = token.slice(0, chunkSize);
  const part2 = token.slice(chunkSize + 1, token.indexOf('.', chunkSize + 1));
  const part3 = token.slice(token.indexOf('.', chunkSize + 1) + 1);

  const headers = new HttpHeaders({
    'X-Token-Part1': part1,
    'X-Token-Part2': part2,
    'X-Token-Part3': part3
  });
  console.log("headers");
  console.log (part1);
  console.log (part2);
  console.log (part3);
  return this.http.get('https://node-red.studybuddy.top/agrar/sensors', { headers });

  }

  // Beispiel für einen weiteren Request
  getSensorData(sensorId: string, valueName: string, startOffset: number, endOffset: number, token: string | null): Observable<any> {
    if(!token) {
      console.log("Token nicht vorhanden!");
      return new Observable();
    }

    // @ts-ignore
    const chunkSize = token.indexOf('.');
    // @ts-ignore
    const part11 = token.slice(0, chunkSize);
    // @ts-ignore
    const part22 = token.slice(chunkSize + 1, token.indexOf('.', chunkSize + 1));
    // @ts-ignore
    const part33 = token.slice(token.indexOf('.', chunkSize + 1) + 1);


    const headers = new HttpHeaders({
      'X-Token-Part1': part11,
      'X-Token-Part2': part22,
      'X-Token-Part3': part33
    });

    return this.http.get(`${this.apiUrl}/data?sensorId=${sensorId}&valueName=${valueName}&startOffset=${startOffset}&endOffset=${endOffset}`, { headers });
  }
}
