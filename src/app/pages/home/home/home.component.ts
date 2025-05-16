import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Neu: CommonModule importieren
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

@Component({
  selector: 'app-home',
  imports: [CommonModule], // Neu: CommonModule statt NgForOf, um ngIf und ngFor zu unterstützen
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
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
    this.socket = new WebSocket('ws://node-red.studybuddy.top/liveDataAgrar');
  }

  ngOnInit() {
    if (!this.authToken) {
      console.warn('No auth token found, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      console.log('Auth Token:', this.authToken); // Debug: Token ausgeben
      this.checkuserlogin();
      this.extractUserIdFromToken();
      this.loadUsername();
      this.loadWarnings();
      this.loadSensorData();
      this.setupWebSocket();
      // Regelmäßige Prüfung auf Inaktivität
      setInterval(() => this.checkSensorActivity(), 60000); // Alle 60 Sekunden prüfen
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
      console.log("Auth Token Stimmt nicht")
      console.error('Kein authToken verfügbar, kann Benutzerdaten nicht laden.');
      this.username = 'Unbekannt';
      return;
    }

    this.userService.getUser(this.authToken).subscribe({
      next: (user) => {
        console.log('Empfangene Benutzerdaten:', user);
        // Detaillierte Ausgabe einzelner Felder
        console.log('Vorname:', user.firstname);
        console.log('Nachname:', user.lastname);
        console.log('E-Mail:', user.email);
        // Falls es zusätzliche Felder gibt
        console.log('Zusätzliche Felder:', Object.keys(user).filter(key => !['firstname', 'lastname', 'email'].includes(key)).map(key => ({ [key]: user[key] })));
        this.username = user.firstname || 'Unbekannt';
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
          // Initiale Daten von /agrar/data/last abrufen
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
                  // Inaktivitätsstatus prüfen
                  formattedSensor.isActive = this.isSensorActive(formattedSensor.timestamp);
                  this.sensorChanges.push(formattedSensor);
                  // Historische Daten für die Differenz abrufen
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

    // Daten von vor 15 Minuten abrufen mit /agrar/data/last/fifteen
    this.sensorService.getLastDataFifteen(sensor.sensorId, sensor.valueName, this.authToken).subscribe(
      (data) => {
        let difference = null;
        if (data && data.values && data.values.length > 0) {
          const previousValue = data.values[data.values.length - 1]; // Letzter Wert vor 15 Minuten
          const currentValue = sensor.value;
          difference = (currentValue - previousValue).toFixed(2);
        }

        // SensorChanges aktualisieren
        const sensorIndex = this.sensorChanges.findIndex(s => s.ident === sensor.ident);
        if (sensorIndex !== -1) {
          this.sensorChanges[sensorIndex] = {
            ...this.sensorChanges[sensorIndex],
            difference
          };
          // Beschreibung mit der Differenz aktualisieren
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
          // Beschreibung ohne Differenz
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
        formattedSensor.isActive = true; // Sensor ist aktiv, da wir gerade Daten erhalten haben

        if (sensorIndex !== -1) {
          this.sensorChanges[sensorIndex] = formattedSensor;
          // Historische Daten für die aktualisierten Daten abrufen
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

  // Prüft, ob ein Sensor aktiv ist, basierend auf dem Timestamp
  isSensorActive(timestamp: string | undefined): boolean {
    if (!timestamp) return false;

    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const timeDiff = (now.getTime() - lastUpdate.getTime()) / 1000 / 60; // Zeitdifferenz in Minuten
    return timeDiff <= 5; // Sensor ist aktiv, wenn die letzte Aktualisierung weniger als 5 Minuten her ist
  }

  // Regelmäßige Prüfung auf Inaktivität
  checkSensorActivity() {
    this.sensorChanges = this.sensorChanges.map(sensor => {
      const isActive = this.isSensorActive(sensor.timestamp);
      return { ...sensor, isActive };
    });
  }

  getDynamicDescription(valueName: string, value: number, difference: string | null, unit: string): string {
    if (difference === null) {
      // Keine Differenz verfügbar
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

    // Initiale Beschreibung ohne Differenz
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
      isActive: true // Initial auf aktiv setzen
    };
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
