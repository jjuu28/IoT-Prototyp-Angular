import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForOf } from '@angular/common';
import { MessageService } from '../../../services/message.service';

interface SensorData {
  value: number;
  unit: string;
  valueName: string;
  fieldName?: string;
  ident: string;
}

@Component({
  selector: 'app-home',
  imports: [NgForOf],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent implements OnInit {
  username: string = '';
  messages: any = null;
  sensorChanges: any[] = [];
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  private socket: WebSocket;

  constructor(private router: Router, private messageService: MessageService) {
    this.socket = new WebSocket('ws://node-red.studybuddy.top/liveDataAgrar');
  }

  ngOnInit() {
    if (!this.authToken) {
      console.warn('No auth token found, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      this.loadUsername();
      this.loadWarnings();
      this.loadSensorData();
      this.setupWebSocket();
    }
  }

  loadUsername() {
    this.username = 'test';
  }

  async loadSensorData() {
    try {
      const response = await fetch('https://node-red.studybuddy.top/agrar/sensors', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Sensordaten');
      }

      const sensors: SensorData[] = await response.json();
      this.sensorChanges = sensors.map(sensor => this.formatSensorData(sensor));
    } catch (error) {
      console.error('Fehler beim Abrufen der Sensordaten:', error);
    }
  }

  async loadWarnings() {
    try {
      const response = await fetch('https://node-red.studybuddy.top/agrar/warnings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Warnungen:', error);
    }
  }

  setupWebSocket() {
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Live-Daten erhalten:', data);

        const sensorIndex = this.sensorChanges.findIndex(sensor => sensor.ident === data.ident);
        if (sensorIndex !== -1) {
          this.sensorChanges[sensorIndex] = this.formatSensorData(data);
        } else {
          this.sensorChanges.push(this.formatSensorData(data));
        }
      } catch (error) {
        console.error('Fehler beim Verarbeiten der WebSocket-Daten:', error);
      }
    };
  }

  formatSensorData(sensor: SensorData) {
    let icon = '';
    let description = '';

    if (sensor.valueName.toLowerCase().includes('temperature')) {
      icon = '🌡️';
      description = `Temperatur erhöht um ${sensor.value}°C`;
    } else if (sensor.valueName.toLowerCase().includes('humidity')) {
      icon = '💧';
      description = `Luftfeuchtigkeit beträgt ${sensor.value}%`;
    } else {
      icon = '🔍';
      description = `${sensor.valueName}: ${sensor.value} ${sensor.unit}`;
    }

    return {
      sensorName: `${icon} ${sensor.valueName} Sensor`,
      fieldName: sensor.fieldName || 'Unbekanntes Feld',
      description,
      value: `${sensor.value} ${sensor.unit}`,
      ident: sensor.ident
    };
  }


  navigate(route: string) {
    this.router.navigate([route]);
  }
}
