import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {Router, RouterLink} from "@angular/router";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    NgIf,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  currentRoute: string = '';

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  emailError: string = '';
  passwordError: string = '';
  apiUrl: string = 'https://node-red.walimteam.nl/agrar';

  constructor(private router: Router) {}

  async loginUser() {
    this.emailError = '';
    this.passwordError = '';
    let valid = true;

    if (!this.email.includes('@')) {
      this.emailError = 'Gültige E-Mail-Adresse eingeben.';
      valid = false;
    }
    if (this.password.length < 6) {
      this.passwordError = 'Passwort muss mindestens 6 Zeichen lang sein.';
      valid = false;
    }

    if (valid) {
      const requestData = { email: this.email, password: this.password };

      try {
        const response = await fetch(`${this.apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();

        if (data.success) {
          alert('Login erfolgreich!');

          if (data.userId && data.token) {
            if (this.rememberMe) {
              localStorage.setItem('userId', data.userId);
              localStorage.setItem('authToken', data.token);
            } else {
              sessionStorage.setItem('userId', data.userId);
              sessionStorage.setItem('authToken', data.token);
            }
          }
          this.router.navigate(['']); // Angular Router statt window.location
        } else {
          alert('Fehler: ' + data.message);
        }
      } catch (error) {
        console.error('Fehler beim Login:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    }
  }

  checkLoggedInUser() {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (userId && authToken) {
      this.router.navigate(['/dashboard']);
    }
  }

  logoutUser() {
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }

  ngOnInit() {
    this.checkLoggedInUser();
  }


}
