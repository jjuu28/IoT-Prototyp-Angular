import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../services/message.service';
import { SensorService } from '../../../services/sensor.service';
import { UserService } from '../../../services/user.service';


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

// Interface für die Meldungen
interface Message {
  title: string;
  description: string;
  sensorId?: string;
  fieldName?: string;
}

// Interface für Benutzerdaten (an Backend-Response angepasst)
interface UserResponse {
  success: boolean;
  userData: {
    firstname: string;
    lastname: string;
    email: string;
    sensorId?: string;
  };
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  username: string = '';
  messages: Message[] = [];
  sensorChanges: any[] = [];
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  private socket: WebSocket;
  private userId: string | null = null;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private sensorService: SensorService,
    private userService: UserService
  ) {
    this.socket = new WebSocket('wss://node-red.studybuddy.top/liveDataAgrar');
  }

  ngOnInit() {
    if (!this.authToken) {
      console.warn('No auth token found, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      console.log('Auth Token:', this.authToken);
      this.checkuserlogin();
      this.extractUserIdFromToken();
      this.loadUsername();
      this.loadWarnings();
      this.loadSensorData();
      this.setupWebSocket();
      setInterval(() => this.checkSensorActivity(), 60000);
    }
  }

  private checkuserlogin() {
    if (!this.authToken) {
      console.warn('Kein authToken gefunden, Benutzer nicht eingeloggt.');
      this.router.navigate(['/login']);
    } else {
      console.log('Benutzer ist eingeloggt.');
    }
  }

  private extractUserIdFromToken() {
    if (this.authToken) {
      try {
        const payload = JSON.parse(atob(this.authToken.split('.')[1]));
        this.userId = payload.sub || payload.userId || null;
        console.log('Extrahierte userId:', this.userId);
      } catch (error) {
        console.error('Fehler beim Dekodieren des Tokens:', error);
        this.userId = null;
      }
    }
  }

  loadUsername() {
    console.log("halloooooooooooooooooooooooooooooooo");
    if (!this.authToken) {
      console.log("Auth Token Stimmt nicht");
      console.error('Kein authToken verfügbar, kann Benutzerdaten nicht laden.');
      this.username = 'Unbekannt';
      return;
    }

    this.userService.getUser(this.authToken).subscribe({
      next: (response: any) => {
        console.log('Empfangene Benutzerdaten:', response);
        // Zugriff auf die verschachtelten Daten in userData
        const userData = response.userData;
        console.log('Vorname:', userData.firstname);
        console.log('Nachname:', userData.lastname);
        console.log('E-Mail:', userData.email);
        this.username = `${userData.firstname || 'Unbekannt'} ${userData.lastname || ''}`.trim();
      },
      error: (error) => {
        console.error('Fehler beim Abrufen der Benutzerdaten:', error);
        if (error.status === 0) {
          console.error('Netzwerkfehler: Möglicherweise CORS-Problem oder Server nicht erreichbar.');
        } else {
          console.error('HTTP-Status:', error.status, 'Fehlermeldung:', error.message);
        }
        this.username = 'Unbekannt';
      }
    });
  }

  loadSensorData() {
    if (!this.authToken) {
      console.error('Kein authToken verfügbar, kann Sensordaten nicht laden.');
      return;
    }

    this.sensorService.getSensors(this.authToken).subscribe(
      (sensors) => {
        console.log('Empfangene Sensoren:', sensors);
        sensors.forEach((sensor: SensorData) => {
          if (sensor.sensorId && sensor.valueName) {
            this.sensorService.getLastData(sensor.sensorId, sensor.valueName, null, this.authToken).subscribe(
              (data) => {
                if (data && data.values && data.values.length > 0) {
                  const latestValue = data.values[data.values.length - 1];
                  const latestTimestamp = data.timestamps[data.timestamps.length - 1];
                  const updatedSensor = {
                    ...sensor,
                    value: latestValue,
                    timestamp: new Date(latestTimestamp).toLocaleString()
                  };
                  const formattedSensor = this.formatSensorData(updatedSensor);
                  formattedSensor.isActive = this.isSensorActive(formattedSensor.timestamp);
                  this.sensorChanges.push(formattedSensor);
                  this.fetchHistoricalData(updatedSensor, formattedSensor);
                }
              },
              (error) => {
                console.error('Fehler beim Abrufen der letzten Daten:', error);
                const formattedSensor = this.formatSensorData({
                  ...sensor,
                  timestamp: new Date().toLocaleString()
                });
                formattedSensor.isActive = this.isSensorActive(formattedSensor.timestamp);
                this.sensorChanges.push(formattedSensor);
              }
            );
          }
        });
      },
      (error) => {
        console.error('Fehler beim Abrufen der Sensordaten:', error);
        this.sensorChanges = [];
      }
    );
  }

  fetchHistoricalData(sensor: SensorData, formattedSensor: any) {
    if (!sensor.sensorId || !sensor.valueName) {
      console.warn('SensorId oder valueName fehlt, kann historische Daten nicht abrufen:', sensor);
      return;
    }

    this.sensorService.getLastDataFifteen(sensor.sensorId, sensor.valueName, this.authToken).subscribe(
      (data) => {
        let difference = null;
        if (data && data.values && data.values.length > 0) {
          const previousValue = data.values[data.values.length - 1];
          const currentValue = sensor.value;
          difference = (currentValue - previousValue).toFixed(2);
        }

        const sensorIndex = this.sensorChanges.findIndex(s => s.ident === sensor.ident);
        if (sensorIndex !== -1) {
          this.sensorChanges[sensorIndex] = {
            ...this.sensorChanges[sensorIndex],
            difference
          };
          this.sensorChanges[sensorIndex].description = this.getDynamicDescription(
            this.sensorChanges[sensorIndex].valueName,
            this.sensorChanges[sensorIndex].value,
            this.sensorChanges[sensorIndex].difference,
            this.sensorChanges[sensorIndex].unit
          );
        }
      },
      (error) => {
        console.error('Fehler beim Abrufen der historischen Daten:', error);
        const sensorIndex = this.sensorChanges.findIndex(s => s.ident === sensor.ident);
        if (sensorIndex !== -1) {
          this.sensorChanges[sensorIndex] = {
            ...this.sensorChanges[sensorIndex],
            difference: null
          };
          this.sensorChanges[sensorIndex].description = this.getDynamicDescription(
            this.sensorChanges[sensorIndex].valueName,
            this.sensorChanges[sensorIndex].value,
            null,
            this.sensorChanges[sensorIndex].unit
          );
        }
      }
    );
  }

  loadWarnings() {
    if (!this.userId) {
      console.error('Keine userId verfügbar, kann Warnungen nicht laden.');
      return;
    }

    this.messageService.getMessages(this.userId, this.authToken).subscribe({
      next: (data: any) => {
        this.messages = data.map((msg: any) => ({
          title: msg.title || 'Dringend!',
          description: msg.description || 'Sensor Störung erkannt',
          sensorId: msg.sensorId,
          fieldName: msg.fieldName || 'Unbekanntes Feld'
        }));
      },
      error: (error) => {
        console.error('Fehler beim Abrufen der Warnungen:', error);
        this.messages = [];
      }
    });
  }

  setupWebSocket() {
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Live-Daten erhalten:', data);

        const sensorIndex = this.sensorChanges.findIndex(sensor => sensor.ident === data.ident);
        const updatedSensor = {
          ...data,
          timestamp: new Date().toLocaleString()
        };

        const formattedSensor = this.formatSensorData(updatedSensor);
        formattedSensor.isActive = true;

        if (sensorIndex !== -1) {
          this.sensorChanges[sensorIndex] = formattedSensor;
          this.fetchHistoricalData(updatedSensor, formattedSensor);
        } else {
          this.sensorChanges.push(formattedSensor);
          this.fetchHistoricalData(updatedSensor, formattedSensor);
        }
      } catch (error) {
        console.error('Fehler beim Verarbeiten der WebSocket-Daten:', error);
      }
    };
  }

  isSensorActive(timestamp: string | undefined): boolean {
    if (!timestamp) return false;

    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const timeDiff = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
    return timeDiff <= 5;
  }

  checkSensorActivity() {
    this.sensorChanges = this.sensorChanges.map(sensor => {
      const isActive = this.isSensorActive(sensor.timestamp);
      return { ...sensor, isActive };
    });
  }

  getDynamicDescription(valueName: string, value: number, difference: string | null, unit: string): string {
    if (difference === null) {
      if (valueName.toLowerCase().includes('temperature')) {
        return `Temperatur: ${value}°C`;
      } else if (valueName.toLowerCase().includes('humidity')) {
        return `Luftfeuchtigkeit: ${value}%`;
      } else {
        return `${valueName}: ${value} ${unit}`;
      }
    }

    const diffValue = parseFloat(difference);
    const changeText = diffValue >= 0 ? 'erhöht' : 'gesunken';
    const absDifference = Math.abs(diffValue).toFixed(2);

    if (valueName.toLowerCase().includes('temperature')) {
      return `Temperatur ${changeText} um ${absDifference}°C (im Vergleich zu vor 15 Minuten)`;
    } else if (valueName.toLowerCase().includes('humidity')) {
      return `Luftfeuchtigkeit ${changeText} um ${absDifference}% (im Vergleich zu vor 15 Minuten)`;
    } else {
      return `${valueName} ${changeText} um ${absDifference} ${unit} (im Vergleich zu vor 15 Minuten)`;
    }
  }

  formatSensorData(sensor: SensorData) {
    let icon = '';
    let description = '';

    if (sensor.valueName.toLowerCase().includes('temperature')) {
      icon = '🌡️';
      description = `Temperatur: ${sensor.value}°C`;
    } else if (sensor.valueName.toLowerCase().includes('humidity')) {
      icon = '💧';
      description = `Luftfeuchtigkeit: ${sensor.value}%`;
    } else {
      icon = '🔍';
      description = `${sensor.valueName}: ${sensor.value} ${sensor.unit}`;
    }

    return {
      sensorName: `${icon} ${sensor.valueName} Sensor`,
      fieldName: sensor.fieldName || 'Unbekanntes Feld',
      description,
      value: `${sensor.value} ${sensor.unit}`,
      unit: sensor.unit,
      valueName: sensor.valueName,
      ident: sensor.ident,
      timestamp: sensor.timestamp,
      sensorId: sensor.sensorId,
      isActive: true
    };
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
