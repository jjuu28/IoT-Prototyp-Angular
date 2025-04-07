import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AddSensorRoutingModule } from './add-sensor-routing.module';
import { AddSensorComponent } from './add-sensor.component';
import {FormsModule} from "@angular/forms";


@NgModule({
  declarations: [
    AddSensorComponent
  ],
    imports: [
        CommonModule,
        AddSensorRoutingModule,
        FormsModule
    ]
})
export class AddSensorModule { }
