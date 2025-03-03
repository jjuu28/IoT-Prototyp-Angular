import {Component, NgModule, OnInit} from '@angular/core';
import { SensorService } from '../../../services/sensor.service';
import { WebSocketService } from '../../../services/websocket.service';
import {Router, RouterModule} from '@angular/router';
import Chart from 'chart.js/auto';
import {CommonModule, NgForOf} from '@angular/common';
import {HttpClientModule } from '@angular/common/http'; // ✅ HttpClientModule importieren


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    NgForOf
  ],
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  sensors: any[] = [];
  charts: { [key: string]: any } = {};
  liveTimeouts: { [key: string]: any } = {};
  darkMode: boolean = false;
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  constructor(private router: Router, private sensorService: SensorService, private webSocketService: WebSocketService) {}

  ngOnInit() {
    if (!this.authToken) {
      console.warn("Kein Token gefunden. Weiterleitung zur Login-Seite...");
      this.router.navigate(['/login']);
    } else {
      this.loadSensors();
      this.listenForLiveUpdates();
      this.darkMode = localStorage.getItem("darkMode") === "enabled";
    }

  }

  loadSensors() {
    this.sensorService.getSensors(this.authToken!).subscribe(
      (sensors) => {
        this.sensors = sensors;
        this.sensors.forEach(sensor => this.createSensorCard(sensor));
      },
      (error) => console.error("Fehler beim Abrufen der Sensoren", error)
    );
  }

  createSensorCard(sensor: any) {
    setTimeout(() => {
      const ctx = document.getElementById(`chart-${sensor.ident}`) as HTMLCanvasElement;
      if (!ctx) return;

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
    }, 100);
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
    this.sensorService.getSensorData(sensorId, valueName, startOffset, endOffset).subscribe((data) => {
      if (this.charts[ident]) {
        this.charts[ident].data.labels = data.timestamps.map((t: any) => new Date(t).toLocaleTimeString());
        this.charts[ident].data.datasets[0].data = data.values;
        this.charts[ident].update();
      }
    });
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
}
