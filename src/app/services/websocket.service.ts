import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import { webSocket } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$ = webSocket('wss://node-red.studybuddy.top/liveDataAgrar');

  getMessages(): Observable<any> {
    return this.socket$.asObservable();
  }
}
