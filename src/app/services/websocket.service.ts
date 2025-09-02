import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$ = webSocket({
    url: 'wss://node-red.walimteam.nl/liveDataAgrar',
    deserializer: msg => JSON.parse(msg.data),
    openObserver: {
      next: () => console.log('WebSocket verbunden!')
    },
    closeObserver: {
      next: (event) => console.warn('WebSocket getrennt!', event)
    }
  });

  getMessages(): Observable<any> {
    return this.socket$.asObservable();
  }
}
