import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import {DashboardRoutingModule} from './dashboard-routing.module'; // ✅ Muss hier sein

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    DashboardRoutingModule,
    // ✅ Muss hier rein!
  ]
})
export class DashboardModule { }
