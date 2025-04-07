import { Component } from '@angular/core';
import {SensorService} from '../services/sensor.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-add-sensor',
  standalone: false,
  templateUrl: './add-sensor.component.html',
  styleUrl: './add-sensor.component.css'
})
export class AddSensorComponent {
  sensorId: string = '';
  fieldName: string = '';
  message: string = '';
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  allFields: any[] = [];
  filteredFields: any[] = [];
  showDropdown: boolean = false;

  ngOnInit() {
    this.sensorService.getAllFields(this.authToken).subscribe(fields => {
      this.allFields = fields.fields;
      this.filteredFields = [...this.allFields];
    });
  }

  filterFields() {
    const term = this.fieldName?.toLowerCase() || '';
    this.filteredFields = this.allFields.filter((field: any) =>
      field.field_name.toLowerCase().includes(term)
    );
    this.showDropdown = true;
  }

  selectField(name: string) {
    this.fieldName = name;
    this.showDropdown = false;
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 150); // Zeit für Klick
  }

  constructor(private sensorService: SensorService, private router: Router) {}

  addSensor() {
    if (!this.sensorId ) {
      this.message = '❗ Bitte sensorId Feld ausfüllen.';
      return;
    }

    this.sensorService.addSensor(this.sensorId, this.authToken).subscribe({
      next: () => this.message = '✅ Sensor wurde erfolgreich hinzugefügt!',
      error: () => this.message = '❌ Fehler beim Hinzufügen.'
    });

    if(!this.fieldName) {
      return;
    }
    this.sensorService.changeSensorField(this.sensorId, this.fieldName, this.authToken).subscribe({
      next: () => this.message = '✅ Sensor wurde erfolgreich hinzugefügt!',
      error: () => this.message = '❌ Fehler beim Hinzufügen.'
    })
  }
  navigateToDashboard() {
    this.router.navigate(['/dashboard'])
  }
}
