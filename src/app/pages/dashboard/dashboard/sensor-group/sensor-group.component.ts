import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { SensorService } from '../../../../services/sensor.service';
import {NgForOf, NgIf} from '@angular/common';
import {firstValueFrom} from 'rxjs';

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
          this.loadLastSensorValue(sensor);
        });
      },
      (error: any) => console.error("❌ Fehler beim Laden der Sensoren:", error)
    );
  }

  // 🆕 Sensorlimits abrufen
  loadSensorLimits(sensor: any) {
    if (!this.authToken) return;

    this.sensorService.getSensorLimits(sensor.sensorId, sensor.valueName, this.authToken).subscribe(
      (data) => {
        console.log(data);
        //data is a object
        sensor.limitUpper = data.data.grenzeOben ?? "Nicht gesetzt";
        sensor.limitLower = data.data.grenzeUnten ?? "Nicht gesetzt";
      },
      (error) => console.error(`❌ Fehler beim Abrufen der Limits für ${sensor.sensorId}:`, error)
    );
  }

  editSensorLimits(sensor: any) {
    const upperLimit = prompt("Gib die neue obere Grenze ein:", sensor.limitUpper);
    const lowerLimit = prompt("Gib die neue untere Grenze ein:", sensor.limitLower);

    // Validierung der Eingaben
    // upperLimit und lowerLimit müssen Zahlen sein und upperLimit muss größer als lowerLimit sein
    // @ts-ignore
    if (isNaN(parseFloat(upperLimit)) || isNaN(parseFloat(lowerLimit))) {
      alert("Bitte gültige Zahlen eingeben!");
      return;
    }
    // @ts-ignore
    if (parseFloat(upperLimit) <= parseFloat(lowerLimit)) {
      alert("Die obere Grenze muss größer als die untere Grenze sein!");
      return;
    }
    if (upperLimit !== null && lowerLimit !== null) {
      this.sensorService.updateSensorLimits(sensor.sensorId, parseFloat(upperLimit), parseFloat(lowerLimit), this.authToken, sensor.valueName).subscribe(
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

    this.sensorService.getSensorMessages(sensor.sensorId, sensor.valueName, this.authToken).subscribe(
      (data) => {
        const messages = Array.isArray(data?.data) ? data.data : [];

        sensor.messages = data.data.map((msg: { Meldung: any; MeldungDate: string | number | Date; }) => {
          const date = msg.MeldungDate ? new Date(msg.MeldungDate) : null;
          const formattedDate = date && !isNaN(date.getTime()) ? date.toLocaleString() : 'Keine Meldung';

          return {
            text: msg.Meldung,
            date: formattedDate
          };
        });

      }
      ,
      (error) => console.error(`❌ Fehler beim Abrufen der Meldungen für ${sensor.sensorId}, ${sensor.valueName}:`, error)
    );
  }

  deleteSensorMessage(sensor: any) {
    console.log("🔄 Lösche Meldung für Sensor:", sensor.sensorId);
    this.sensorService.deleteSensorMessage(sensor.sensorId, sensor.valueName, this.authToken).subscribe(
      () => {
        sensor.messages = [];
        console.log(`✅ Meldung für ${sensor.sensorId} gelöscht!`);
      },
      (error) => console.error(`❌ Fehler beim Löschen der Meldung für ${sensor.sensorId}:`, error)
    );
  }

  loadLastSensorValue(sensor: any): void {
    if (!this.authToken) return;

    this.sensorService.getLatestData(sensor.sensorId, sensor.valueName, this.authToken).subscribe(
      (data) => {
        const values = Array.isArray(data?.values) ? data.values : [];
        const timestamps = Array.isArray(data?.timestamps) ? data.timestamps : [];

        if (values.length > 0 && timestamps.length > 0) {
          const value = values[0] ?? "Keine Daten";
          const timestamp = timestamps[0] ? new Date(timestamps[0]) : null;

          let formattedTimestamp = "Kein Zeitstempel";

          if (timestamp && !isNaN(timestamp.getTime())) {
            const day = timestamp.getDate();
            const month = timestamp.getMonth() + 1; // Monat ist 0-indexed
            const year = timestamp.getFullYear().toString().slice(-2); // letzte zwei Stellen
            const hours = timestamp.getHours().toString().padStart(2, '0');
            const minutes = timestamp.getMinutes().toString().padStart(2, '0');

            //formattedTimestamp = `${day}.${month}.${year}, ${hours}:${minutes}`;
            formattedTimestamp = `${hours}:${minutes}, ${day}.${month}.${year}`;
          }

          sensor.lastValueString = `${value} um ${formattedTimestamp}`;
        } else {
          sensor.lastValueString = "Keine Daten";
        }
      },
      (error) => {
        console.error(`❌ Fehler beim Abrufen des letzten Wertes für ${sensor.sensorId}, ${sensor.valueName}:`, error);
        sensor.lastValueString = "Fehler";
      }
    );
  }


}
