import { Component } from '@angular/core';
import { MatBottomSheetRef, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import {formatDate} from 'date-fns';

interface Preset { label: string; startOffsetH: number; endOffsetH: number; }

@Component({
  selector: 'app-custom-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,           // <<< hier statt einzelner Datepicker‐Direktiven
    MatDatepickerModule,      // <<< MatDatepickerModule deckt auch range picker
    MatNativeDateModule,
    NgxSliderModule
  ],
  templateUrl: './custom-range-picker.component.html',
  styleUrls: ['./custom-range-picker.component.css'],
})
export class CustomRangePickerComponent {
  private ZOOM_MARGIN_MIN = 5 * 60 * 1000;
  startDate = new Date();
  endDate = new Date();
  // Slider-Werte als Millisekunden seit Epoch
  startTimestamp = this.startDate.getTime() - 60 * 60 * 5000;
  endTimestamp   = this.endDate.getTime();

  formatDate(timestamp: number): string {
    // Formatierung: HH:mm Uhr - DD.MM.YYYY
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} Uhr ${day}.${month}.${year}`;
    //return new Date(timestamp).toLocaleString();
  }
  presets: Preset[] = [
    { label: 'Letzte 10 Minuten', startOffsetH:  -0.1, endOffsetH: 0 },
    { label: 'Letzte 1 Stunde', startOffsetH: -1, endOffsetH: 0 },
    { label: 'Letzte 24 Std.', startOffsetH: -24, endOffsetH: 0 },
    { label: 'Letzte 7 Tage',  startOffsetH: -168, endOffsetH: 0 },
  ];

  // Optionen für ngx-slider
  sliderOptions: Options = {
    //floor bis 0 Uhr als Startwert, uabhängig der aktuellen Zeit also heutiges uhrzeit + datum minus uhrzeit sodass auf 0 uhr
    floor: this.startOfDay(this.startDate).getTime(),
    ceil:  this.endDate.getTime(),
    step:  60 * 1000,   // 1 Minute in ms
    translate: (value: number) => {
      if (value === this.startTimestamp || value === this.endTimestamp) {
        return ''; // Disable low and high pointer labels
      }
      // Tooltip: lokales Datum + Uhrzeit
      return new Date(value).toLocaleString();
    }
  };
  // nach Datumänderung: Slider neu konfigurieren
  onDateChange() {
    const startOfDay = new Date(this.startDate);
    startOfDay.setHours(0,0,0,0);
    const endOfDay   = new Date(this.endDate);
    endOfDay.setHours(23,59,59,999);

    // Wenn aktuelles slider-Intervall out-of-bounds:
    this.startTimestamp = Math.max(this.startTimestamp, startOfDay.getTime());
    this.endTimestamp   = Math.min(this.endTimestamp,   endOfDay.getTime());

    // Optionen neu setzen (Domain ändert sich)
    this.sliderOptions = {
      ...this.sliderOptions,
      floor: startOfDay.getTime(),
      ceil:  endOfDay.getTime()
    };
    this.updateZoomRange();
  }

  private updateZoomRange() {
    const range = this.endTimestamp - this.startTimestamp;
    // Puffer entweder 10% der Spanne oder mindestens 5 Min.
    const margin = Math.max(range * 0.9, this.ZOOM_MARGIN_MIN);

    const newFloor = this.startTimestamp - margin;
    const newCeil  = this.endTimestamp   + margin;

    this.sliderOptions = {
      ...this.sliderOptions,
      floor: newFloor,
      ceil:  newCeil
    };
  }

  //setzt die zoomrange wieder auf 0 Uhr bis aktuelle Zeit
  private resetZoomRange(){
    const startOfDay = new Date(this.startDate);
    startOfDay.setHours(0,0,0,0);
    const endOfDay   = new Date();

    this.startTimestamp = startOfDay.getTime();
    this.endTimestamp   = endOfDay.getTime();

    this.sliderOptions = {
      ...this.sliderOptions,
      floor: startOfDay.getTime(),
      ceil:  endOfDay.getTime()
    };
  }

  private startOfDay(d: Date) {
    const s = new Date(d); s.setHours(0,0,0,0); return s;
  }
  private endOfDay(d: Date) {
    const e = new Date(d); e.setHours(23,59,59,999); return e;
  }

  constructor(public sheetRef: MatBottomSheetRef<CustomRangePickerComponent>) {}



  onSliderChange() {
    // Hier Live-Vorschau aktualisieren (z.B. Chart-Annotationen)
    this.updateZoomRange();
  }

  formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  toMinutes(h: number, m: number): number {
    return h * 60 + m;
  }

  // Presets jetzt ebenfalls als Timestamp-Offsets
  applyPreset(p: Preset) {
    const now = Date.now();
    const start = now + p.startOffsetH * 3600_000;
    const end   = now + p.endOffsetH   * 3600_000;
    this.startDate = new Date(start);
    this.endDate   = new Date(end);
    this.startTimestamp = start;
    this.endTimestamp   = end;
    this.onDateChange();

  }

  // beim Bestätigen zurückliefern
  confirm() {
    this.sheetRef.dismiss({
      start: new Date(this.startTimestamp),
      end:   new Date(this.endTimestamp)
    });
  }

  reset() {
    this.applyPreset({ label: '', startOffsetH: -24, endOffsetH: 0 });
    this.resetZoomRange()
  }

}
