import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddSensorComponent } from './add-sensor.component';

const routes: Routes = [{ path: '', component: AddSensorComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddSensorRoutingModule { }
