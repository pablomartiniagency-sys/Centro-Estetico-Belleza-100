import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { QuienesSomosPage } from './pages/quienes-somos/quienes-somos.page';
import { TratamientosPage } from './pages/tratamientos/tratamientos.page';
import { ContactoPage } from './pages/contacto/contacto.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'quienes-somos', component: QuienesSomosPage },
  { path: 'tratamientos', component: TratamientosPage },
  { path: 'contacto', component: ContactoPage },
  { path: '**', redirectTo: '' }
];
