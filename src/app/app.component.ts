import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'centro-estetico-belleza100';
  showCookieBanner = false;

  constructor(private router: Router, private meta: Meta) {}

  ngOnInit() {
    // Check for cookie consent
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      this.showCookieBanner = true;
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Scroll to top on route change
      window.scrollTo(0, 0);
      
      const url = event.urlAfterRedirects;
      if (url.includes('tratamientos')) {
        this.meta.updateTag({ name: 'description', content: 'Descubre nuestros tratamientos faciales y corporales. Cosmética natural y técnicas avanzadas en Málaga.' });
      } else if (url.includes('contacto')) {
        this.meta.updateTag({ name: 'description', content: 'Reserva tu cita en Centro Estético Belleza 100%. Te esperamos en Málaga para cuidar de ti.' });
      } else if (url.includes('quienes-somos')) {
        this.meta.updateTag({ name: 'description', content: 'Conoce a nuestro equipo de profesionales. En Belleza 100% tu bienestar es nuestra prioridad.' });
      } else {
        this.meta.updateTag({ name: 'description', content: 'Centro Estético Belleza 100% - Te cuidamos con tratamientos faciales, corporales, depilación y uñas, siempre con atención cercana y adaptada a ti en Málaga.' });
      }
    });
  }

  acceptCookies(accepted: boolean) {
    localStorage.setItem('cookieConsent', accepted ? 'true' : 'false');
    this.showCookieBanner = false;
  }
}
