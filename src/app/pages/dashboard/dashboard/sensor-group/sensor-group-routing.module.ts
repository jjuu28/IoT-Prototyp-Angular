import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SensorGroupComponent } from './sensor-group.component';

const routes: Routes = [{ path: ':fieldName', component: SensorGroupComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SensorGroupRoutingModule { }
