import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SensorGroupRoutingModule } from './sensor-group-routing.module';
import { SensorGroupComponent } from './sensor-group.component';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    SensorGroupRoutingModule,
    SensorGroupComponent
  ]
})
export class SensorGroupModule { }
