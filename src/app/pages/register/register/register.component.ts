import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { UserService } from '../../../services/user.service';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgIf,
    RouterLink
  ],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;

  currentRoute: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      firstname: ['', [Validators.required, Validators.minLength(3)]],
      lastname: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      console.log('Formular ungültig:', this.registerForm.errors);
      return;
    }

    const request = {
      userId: this.userService.generateUserId(),
      firstname: this.f['firstname'].value.trim(),
      lastname: this.f['lastname'].value.trim(),
      email: this.f['email'].value.trim(),
      password: this.f['password'].value.trim()
    };

    console.log('Generierte userId:', request.userId);
    console.log('Gesendete Daten:', request);

    this.userService.registerUser(request).subscribe({
      next: (response) => {
        console.log('Serverantwort:', response);
        if (response.success) {
          alert('Registrierung erfolgreich!');
          this.router.navigate(['/login']);
        } else {
          alert('Fehler: ' + (response.message || 'Unbekannter Fehler'));
        }
      },
      error: (error) => {
        console.error('Fehler beim Senden der Daten:', error);
        alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    });
  }
}
