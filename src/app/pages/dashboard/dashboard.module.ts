import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule } from '@angular/router';
import {DashboardRoutingModule} from './dashboard-routing.module'; // ✅ Muss hier sein

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    // ✅ Muss hier rein!
  ]
})
export class DashboardModule { }
