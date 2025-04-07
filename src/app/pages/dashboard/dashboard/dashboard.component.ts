import {Component, OnInit} from '@angular/core';
import { SensorService } from '../../../services/sensor.service';
import { WebSocketService } from '../../../services/websocket.service';
import {Router} from '@angular/router';
import Chart from 'chart.js/auto';
import { NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    NgForOf,
    NgIf,
    FormsModule
  ],
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  sensors: Object = [];
  sensorGroups: { [key: string]: any[] } = {};
  charts: { [key: string]: any } = {};
  fields: string[] = []; // Liste der vorhandenen Felder
  liveTimeouts: { [key: string]: any } = {};
  darkMode: boolean = false;
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  expandedFields: { [key: string]: boolean } = {}; // Zustände für Einklappen der Gruppen
  searchQuery: string = ''; // Suchbegriff für Filterung

  constructor(private router: Router, private sensorService: SensorService, private webSocketService: WebSocketService) {}

  ngOnInit() {
    if (!this.authToken) {
      console.warn("Kein Token gefunden. Weiterleitung zur Login-Seite...");
      this.router.navigate(['/login']);
    } else {
      this.loadSensors();
      setTimeout(() => {
        this.fetchInitialData();
      }, 500);
      this.listenForLiveUpdates();
      this.darkMode = localStorage.getItem("darkMode") === "enabled";
    }
  }

  loadSensors() {
    console.log("AuthToken:", this.authToken);
    this.sensorService.getSensors(this.authToken!).subscribe(
      (sensors) => {
        console.log("Empfangene Sensoren:", sensors);
        this.sensors = sensors;
        this.groupSensorsByField();

        if (!sensors || Object.keys(sensors).length === 0) {
          console.warn("Keine Sensoren gefunden!");
        } else {
          Object.values(this.sensors).forEach((sensor: any) => this.createSensorCard(sensor));
        }
      },
      (error) => { console.error("Fehler beim Abrufen der Sensoren", error); this.logout(); }

    );
  }

  groupSensorsByField() {
    this.sensorGroups = {};
    Object.values(this.sensors).forEach((sensor: any) => {
      const fieldName = sensor.field_name || "Unbekanntes Feld";
      if (!this.sensorGroups[fieldName]) {
        this.sensorGroups[fieldName] = [];
        this.expandedFields[fieldName] = true; // Standardmäßig alle Gruppen geöffnet
        this.fields.push(fieldName);
      }
      this.sensorGroups[fieldName].push(sensor);
    });
  }

  fetchInitialData() {
    console.log("🔄 Abrufen der initialen Sensordaten...");

    for (const sensor of Object.values(this.sensors)) {
      console.log("📡 Daten abrufen für Sensor:", sensor);
      this.updateSensorData(sensor.sensorId, sensor.valueName, sensor.ident, -1, 0);

      if (sensor.endOffset === 0) {
        this.enableLiveData(sensor.ident);
      }
    }
  }


  createSensorCard(sensor: any) {
    setTimeout(() => {
      const ctx = document.getElementById(`chart-${sensor.ident}`) as HTMLCanvasElement;
      if (!ctx) {
        console.error(`Canvas-Element für Sensor ${sensor.ident} nicht gefunden!`);
        return;
      }

      const isDarkMode = this.darkMode;
      const lineColor = isDarkMode ? '#9c27b0' : '#03a9f4';
      const backgroundColor = isDarkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(3, 169, 244, 0.2)';

      this.charts[sensor.ident] = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [{
            label: `${sensor.valueName} (${sensor.unit})`,
            data: [],
            borderColor: lineColor,
            backgroundColor: backgroundColor,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { display: true }, y: { display: true } }
        }
      });

      // **Live-Status-Indikator initialisieren**
      this.updateStatusIndicator(sensor.ident, 'gray');
    }, 100);
  }

  toggleFieldGroup(fieldName: string) {
    this.expandedFields[fieldName] = !this.expandedFields[fieldName];
    // wieder herstellen der charts nach dem einklappen
    if(this.expandedFields[fieldName]){
      this.sensorGroups[fieldName].forEach((sensor: any) => this.createSensorCard(sensor));
      //get data for the sensors with timeout to avoid too many requests
      setTimeout(() => {
        this.sensorGroups[fieldName].forEach((sensor: any) => {
          this.updateSensorData(sensor.sensorId, sensor.valueName, sensor.ident, -1, 0);

        });
      }, 500);

    }
  }

  navigateToFieldPage(fieldName: string) {
    console.log("📍 Navigiere zu:", `/dashboard/field/${fieldName}`);
    this.router.navigate(['/dashboard', 'field', fieldName]).then(success => {
      if (success) {
        console.log("✅ Navigation erfolgreich!");
      } else {
        console.error("❌ Navigation fehlgeschlagen!");
      }
    });
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem("darkMode", this.darkMode ? "enabled" : "disabled");
  }

   logout() {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    window.location.href = "/login";
  }

  updateSensorData(sensorId: string, valueName: string, ident: string, startOffset: number, endOffset: number) {
    console.log(`🔍 Abrufen von Daten für Sensor: ${sensorId}, Wert: ${valueName}, Zeitbereich: ${startOffset} bis ${endOffset}`);

    this.sensorService.getSensorData(sensorId, valueName, startOffset, endOffset, this.authToken).subscribe(
      (data) => {
        console.log("📊 Empfangene Sensordaten:", data);

        if (!data || !data.timestamps || !data.values || data.timestamps.length === 0) {
          console.warn("⚠️ Keine Daten für diesen Sensor vorhanden!");
          return;
        }

        if (this.charts[ident]) {
          this.charts[ident].data.labels = data.timestamps.map((t: any) => new Date(t).toLocaleTimeString());
          this.charts[ident].data.datasets[0].data = data.values;
          this.charts[ident].update();
          console.log(`✅ Diagramm für ${ident} aktualisiert!`);
        }

        // **🚀 Wenn EndOffset 0 ist, aktiviere Live-Daten**
        if (endOffset === 0) {
          this.enableLiveData(ident);
        } else if (endOffset !== 0){
          this.disableLiveData(ident);
        }
      },
      (error) => console.error("❌ Fehler beim Abrufen der Sensordaten:", error)
    );
  }

  enableLiveData(ident: string) {
    if (this.charts[ident]) {
      this.charts[ident].isLive = true;
      this.updateStatusIndicator(ident, 'gray');

      if (this.liveTimeouts[ident]) {
        clearTimeout(this.liveTimeouts[ident]);
      }

      this.liveTimeouts[ident] = setTimeout(() => {
        this.updateStatusIndicator(ident, 'red');
      }, 30000);
    }
  }

  disableLiveData(ident: string) {
    if (this.charts[ident]) {
      this.charts[ident].isLive = false;
      this.updateStatusIndicator(ident, 'red');

      if (this.liveTimeouts[ident]) {
        clearTimeout(this.liveTimeouts[ident]);
        delete this.liveTimeouts[ident];
      }
    }
  }

  updateStatusIndicator(ident: string, color: string) {
    const statusIndicator = document.getElementById(`status-indicator-${ident}`);
    if (statusIndicator) {
      statusIndicator.style.backgroundColor = color;
    }
  }

  promptCustomRange(sensorId: string, valueName: string, ident: string) {
    const startOffset = prompt('Gib den Start-Offset in Stunden ein (z.B. -24 für die letzten 24 Stunden):', '-1');
    const endOffset = prompt('Gib den End-Offset in Stunden ein (z.B. 0 für jetzt):', '0');

    if (startOffset !== null && endOffset !== null) {
      this.updateSensorData(sensorId, valueName, ident, parseFloat(startOffset), parseFloat(endOffset));
    }
  }

  listenForLiveUpdates() {
    this.webSocketService.getMessages().subscribe((data: any) => {
      const ident = data.ident;
      if (!this.charts[ident] || !this.charts[ident].isLive) return;

      const chart = this.charts[ident];
      const timeLabel = new Date().toLocaleTimeString();

      chart.data.labels.push(timeLabel);
      chart.data.datasets[0].data.push(data.value);

      if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      chart.update();
      this.updateStatusIndicator(ident, 'green');

      if (this.liveTimeouts[ident]) {
        clearTimeout(this.liveTimeouts[ident]);
      }

      this.liveTimeouts[ident] = setTimeout(() => {
        this.updateStatusIndicator(ident, 'red');
      }, 30000);
    });
  }
  filterFields(): string[] {
    if (!this.searchQuery) return this.fields;
    return this.fields.filter(field => field.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  protected readonly Object = Object;

  navigateToAddSensor() {
    this.router.navigate(['/dashboard/add-sensor']).then(success => {
      if (success) {
        console.log("✅ Navigation erfolgreich!");
      } else {
        console.error("❌ Navigation fehlgeschlagen!");
      }
    });

  }
}
