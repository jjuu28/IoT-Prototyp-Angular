import {Component, OnInit} from '@angular/core';
import { SensorService } from '../../../services/sensor.service';
import { WebSocketService } from '../../../services/websocket.service';
import {Router} from '@angular/router';
import Chart from 'chart.js/auto';
import { NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(annotationPlugin);


const MAX_POINTS = 50;

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
  showDsPanel = false;
  downsampleEnabled = JSON.parse(localStorage.getItem('dsEnabled') ?? 'true');
  maxPoints        = +(localStorage.getItem('dsPoints') ?? '50');

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

      // Hole die Sensorgrenzen
      this.sensorService.getSensorLimits(sensor.sensorId, sensor.valueName, this.authToken!).subscribe(
        (resp) => {
          const limits = resp.data;
          console.log("📏 Geladene Grenzwerte für", sensor.ident, ":", limits);

          const annotations: any = {};

          if (limits?.grenzeOben != null) {
            annotations['grenzeOben'] = {
              type: 'line',
              yMin: limits.grenzeOben,
              yMax: limits.grenzeOben,
              borderColor: 'red',
              borderWidth: 2,
              label: {
                content: 'Grenze Oben',
                display: false,
                position: 'end',
                color: 'red',
                backgroundColor: 'white'
              }
            };
          }

          if (limits?.grenzeUnten != null) {
            annotations['grenzeUnten'] = {
              type: 'line',
              yMin: limits.grenzeUnten,
              yMax: limits.grenzeUnten,
              borderColor: 'red',
              borderWidth: 2,
              label: {
                content: 'Grenze Unten',
                display: false,
                position: 'start',
                color: 'red',
                backgroundColor: 'white'
              }
            };
          }

          // Erstelle das Chart mit Annotations (auch wenn leer)
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
              plugins: {
                annotation: {
                  annotations: annotations
                }
              },
              scales: {
                x: { display: true },
                y: { display: true }
              }
            },
            plugins: [annotationPlugin]
          });

          this.updateStatusIndicator(sensor.ident, 'gray');
        },
        (err) => {
          console.warn("⚠️ Keine Limits für Sensor", sensor.sensorId);

          // Fallback: Chart ohne Annotations
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
              scales: {
                x: { display: true },
                y: { display: true }
              }
            }
          });

          this.updateStatusIndicator(sensor.ident, 'gray');
        }
      );
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

    this.sensorService.getSensorData(sensorId, valueName,
      startOffset, endOffset,
      this.authToken).subscribe(
      data => {
        if (!data?.timestamps?.length) { return; }

        // ▸ Down‑Sampling nur, wenn nötig
        const { timestamps, values } =
          this.downsample(data.timestamps, data.values);

        const chart = this.charts[ident];
        if (chart) {
          chart.data.labels           = timestamps.map(t =>
            new Date(t).toLocaleTimeString());
          chart.data.datasets[0].data = values;
          this.addDayChangeAnnotations(chart, timestamps);
          chart.update();
        }

        endOffset === 0 ? this.enableLiveData(ident)
          : this.disableLiveData(ident);
      },
      err => console.error('❌ Sensor‑Datenfehler:', err)
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

      if (this.downsampleEnabled && chart.data.labels.length > MAX_POINTS) {
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

  applyDownsampleSettings() {
    localStorage.setItem('dsEnabled', JSON.stringify(this.downsampleEnabled));
    localStorage.setItem('dsPoints',  this.maxPoints.toString());
    this.showDsPanel = false;

    // Optional: Charts sofort neu laden
    Object.values(this.sensors).forEach((s: any) =>
      this.updateSensorData(s.sensorId, s.valueName, s.ident, -1, 0));
  }


  private downsample<T>(
    timestamps: T[],
    values: number[]
  ): { timestamps: T[]; values: number[] } {

    /* ➜ verwende user‑def. maxPoints */
    const max = this.maxPoints;

    if (!this.downsampleEnabled || timestamps.length <= max) {
      return { timestamps, values };
    }

    const step = timestamps.length / max;
    const ts: T[] = [];
    const vs: number[] = [];

    for (let i = 0; i < max; i++) {
      const idx = Math.min(Math.round(i * step), timestamps.length - 1);
      ts.push(timestamps[idx]);
      vs.push(values[idx]);
    }
    return { timestamps: ts, values: vs };
  }

  /** Fügt für jeden Tageswechsel eine gestrichelte Linie + Label ein */
  addDayChangeAnnotations(
    chart: Chart,
    timestamps: (number | string | Date)[]
  ) {
    if (!chart.options.plugins!.annotation) {
      chart.options.plugins!.annotation = { annotations: {} };
    }
    const annos: any = chart.options.plugins!.annotation.annotations;

    let lastDay = '';
    timestamps.forEach((t, idx) => {
      const d = new Date(t);
      const dayKey = d.toISOString().substring(0, 10);   // YYYY‑MM‑DD

      if (idx > 0 && dayKey !== lastDay) {
        annos[`day_${dayKey}`] = {
          type: 'line',

          /* ①  Vor den Datensätzen, also hinter ihnen, zeichnen */
          drawTime: 'beforeDatasetsDraw',   // <— wichtig
          // oder zusätzlich/alternativ:
          z: -10,                           // ganz nach hinten im Zeichen‑Stack

          xMin: idx - 0.5,
          xMax: idx - 0.5,
          borderColor: this.darkMode ? '#aaaaaa' : '#666666',
          borderWidth: 1,
          borderDash: [6, 6],

          label: {
            display: true,
            content: d.toLocaleDateString(),   // 12.05.2025
            position: 'start',
            rotation: 0,
            yAdjust: -6,
            /* ②  Hintergrund völlig durchsichtig */
            backgroundColor: 'rgba(0,0,0,0)',  // oder leicht transparent
            color: this.darkMode ? '#bbb' : '#444',
            font: { style: 'italic', size: 10 }
          }
        };

      }
      lastDay = dayKey;
    });
  }


}
