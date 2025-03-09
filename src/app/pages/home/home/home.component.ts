import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [ ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{

  username: string = '';
  messages: any = null;
  sensorChanges: any[] = [];
  authToken: string | null = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');



  constructor(private router: Router) {}

  ngOnInit() {
    if (!this.authToken) {
      console.warn('No auth token found, redirecting to login');
      this.router.navigate(['/login']);
    } else {
      this.loadUsername();
      this.loadwarnings();
      this.loadsensordata();
    }

  }

  loadUsername() {
    this.username = 'test';
  }

  loadwarnings() {
    this.sensorService.getWarnings().subscribe(
      (messages) => {
        this.messages = messages;
      },
      (error) => console.error("Fehler beim Abrufen der wichtigen Meldungen", error)
    );
  }

  loadsensordata() {
    this.sensorService.getSensorChanges().subscribe(
      (sensorChanges) => {
        this.sensorChanges = sensorChanges;
      },
      (error) => console.error("Fehler beim Abrufen der Sensordaten", error)
    );
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

}
