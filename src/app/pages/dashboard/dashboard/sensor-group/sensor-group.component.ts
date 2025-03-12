import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { SensorService } from '../../../../services/sensor.service';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-sensor-group',
  templateUrl: './sensor-group.component.html',
  imports: [
    RouterLink,
    NgForOf,
    NgIf
  ],
  styleUrls: ['./sensor-group.component.css']
})
export class SensorGroupComponent implements OnInit {
  fieldName: string = '';
  sensors: any = {};
  sensorGroups: { [key: string]: any[] } = {};
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  constructor(private route: ActivatedRoute, private sensorService: SensorService) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.fieldName = params['fieldName'];
      this.loadSensors();
    });
  }

  loadSensors() {
    console.log("🔄 Lade Sensoren für Feld:", this.fieldName);

    this.sensorService.getSensors(this.authToken!).subscribe(
      (allSensors: any) => {
        this.sensors = allSensors;

        // Sensoren gruppieren
        this.sensorGroups = {};
        Object.values(this.sensors).forEach((sensor: any) => {
          const fieldName = sensor.field_name || "Unbekanntes Feld";
          if (!this.sensorGroups[fieldName]) {
            this.sensorGroups[fieldName] = [];
          }
          this.sensorGroups[fieldName].push(sensor);
        });

        // Zeige nur die Sensoren für das gewählte Feld
        this.sensors = this.sensorGroups[this.fieldName] || [];

        // ❗ Lade die Limits und Meldungen für jeden Sensor
        this.sensors.forEach((sensor: any) => {
          this.loadSensorLimits(sensor);
          this.loadSensorMessages(sensor);
        });
      },
      (error: any) => console.error("❌ Fehler beim Laden der Sensoren:", error)
    );
  }

  // 🆕 Sensorlimits abrufen
  loadSensorLimits(sensor: any) {
    if (!this.authToken) return;

    this.sensorService.getSensorLimits(sensor.sensorId, this.authToken).subscribe(
      (data) => {
        sensor.limitUpper = data.grenzeOben ?? "Nicht gesetzt";
        sensor.limitLower = data.grenzeUnten ?? "Nicht gesetzt";
      },
      (error) => console.error(`❌ Fehler beim Abrufen der Limits für ${sensor.sensorId}:`, error)
    );
  }

  editSensorLimits(sensor: any) {
    const upperLimit = prompt("Gib die neue obere Grenze ein:", sensor.limitUpper);
    const lowerLimit = prompt("Gib die neue untere Grenze ein:", sensor.limitLower);

    if (upperLimit !== null && lowerLimit !== null) {
      this.sensorService.updateSensorLimits(sensor.sensorId, parseFloat(upperLimit), parseFloat(lowerLimit), this.authToken).subscribe(
        () => {
          sensor.limitUpper = parseFloat(upperLimit);
          sensor.limitLower = parseFloat(lowerLimit);
          console.log(`✅ Grenzwerte für ${sensor.sensorId} aktualisiert!`);
        },
        (error) => console.error(`❌ Fehler beim Aktualisieren der Grenzwerte für ${sensor.sensorId}:`, error)
      );
    }
  }

  // 🆕 Sensor-Meldungen abrufen
  loadSensorMessages(sensor: any) {
    if (!this.authToken) return;

    this.sensorService.getSensorMessages(sensor.sensorId, this.authToken).subscribe(
      (data) => {
        sensor.messages = data.map((msg: { Meldung: any; MeldungDate: string | number | Date; }) => ({
          text: msg.Meldung,
          date: new Date(msg.MeldungDate).toLocaleString()
        }));
      },
      (error) => console.error(`❌ Fehler beim Abrufen der Meldungen für ${sensor.sensorId}:`, error)
    );
  }

  deleteSensorMessage(sensor: any) {
    this.sensorService.deleteSensorMessage(sensor.sensorId, this.authToken).subscribe(
      () => {
        sensor.messages = [];
        console.log(`✅ Meldung für ${sensor.sensorId} gelöscht!`);
      },
      (error) => console.error(`❌ Fehler beim Löschen der Meldung für ${sensor.sensorId}:`, error)
    );
  }
}
