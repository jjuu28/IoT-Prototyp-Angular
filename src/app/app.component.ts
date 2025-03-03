import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {FooterComponent} from './core/footer/footer.component';
import {NgIf} from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, NgIf],
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

    /* So muss es aussehen wenn footer auf anderen Seiten ausgeblendet werden soll

        this.router.events.subscribe(() => {
      // Liste von Seiten, auf denen der Footer NICHT angezeigt werden soll
      const hiddenFooterRoutes = ['/login', '/register', '/privacy', '/impressum'];

      // Wenn die aktuelle Route in der Liste ist, verstecke den Footer
      this.showFooter = !hiddenFooterRoutes.includes(this.router.url);
     */

  }

}
