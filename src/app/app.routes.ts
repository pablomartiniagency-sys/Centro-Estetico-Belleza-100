import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { QuienesSomosPage } from './pages/quienes-somos/quienes-somos.page';
import { TratamientosPage } from './pages/tratamientos/tratamientos.page';
import { ContactoPage } from './pages/contacto/contacto.page';
import { PoliticaPrivacidadComponent } from './pages/politica-privacidad/politica-privacidad.component';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Inicio - Centro Estético Belleza 100%' },
  { path: 'quienes-somos', component: QuienesSomosPage, title: 'Quiénes Somos - Centro Estético Belleza 100%' },
  { path: 'tratamientos', component: TratamientosPage, title: 'Tratamientos Faciales y Corporales - Centro Estético' },
  { path: 'contacto', component: ContactoPage, title: 'Contacto y Citas - Centro Estético Belleza 100%' },
  { path: 'politica-privacidad', component: PoliticaPrivacidadComponent, title: 'Política de Privacidad' },
  { path: '**', redirectTo: '' }
];
