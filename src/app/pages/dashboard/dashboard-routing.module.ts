import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from '../login/login/login.component';
import {DashboardComponent} from './dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  { path: 'field', loadChildren: () => import('./dashboard/sensor-group/sensor-group.module').then(m => m.SensorGroupModule) },
  { path: 'field/:fieldName', loadChildren: () => import('./dashboard/sensor-group/sensor-group.module').then(m => m.SensorGroupModule)},
  { path: 'add-sensor', loadChildren: () => import('../../add-sensor/add-sensor.module').then(m => m.AddSensorModule) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
