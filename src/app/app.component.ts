import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {FooterComponent} from './core/footer/footer.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'AngularTest';

  showFooter = true;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      // Wenn die aktuelle URL '/login' ist, blende den Footer aus
      this.showFooter = this.router.url !== '/login';    });
  }
}
