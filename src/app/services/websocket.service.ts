import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$ = webSocket({
    url: 'wss://node-red.studybuddy.top/liveDataAgrar',
    deserializer: msg => JSON.parse(msg.data),  // JSON richtig deserialisieren
    openObserver: {
      next: () => console.log('WebSocket verbunden!')  // Logging für Debugging
    },
    closeObserver: {
      next: (event) => console.warn('WebSocket getrennt!', event)
    }
  });

  getMessages(): Observable<any> {
    return this.socket$.asObservable();
  }
}
