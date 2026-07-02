import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { QuienesSomosPage } from './pages/quienes-somos/quienes-somos.page';
import { TratamientosPage } from './pages/tratamientos/tratamientos.page';
import { ContactoPage } from './pages/contacto/contacto.page';
import { PoliticaPrivacidadComponent } from './pages/politica-privacidad/politica-privacidad.component';
import { ReservarComponent } from './pages/reservar/reservar.component';
import { MisCitasComponent } from './pages/mis-citas/mis-citas.component';
import { ReservaEnlaceComponent } from './pages/reserva-enlace/reserva-enlace.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { AgendaComponent } from './pages/admin/agenda/agenda.component';
import { ServiciosComponent } from './pages/admin/servicios/servicios.component';
import { DisponibilidadComponent } from './pages/admin/disponibilidad/disponibilidad.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Inicio - Centro Estético Belleza 100%' },
  { path: 'quienes-somos', component: QuienesSomosPage, title: 'Quiénes Somos - Centro Estético Belleza 100%' },
  { path: 'tratamientos', component: TratamientosPage, title: 'Tratamientos Faciales y Corporales - Centro Estético' },
  { path: 'contacto', component: ContactoPage, title: 'Contacto y Citas - Centro Estético Belleza 100%' },
  { path: 'politica-privacidad', component: PoliticaPrivacidadComponent, title: 'Política de Privacidad' },
  
  // Public booking
  { path: 'reservar', component: ReservarComponent, title: 'Reservar Cita - Centro Estético Belleza 100%' },
  { path: 'reserva/:token', component: ReservaEnlaceComponent, title: 'Reserva Exclusiva' },
  
  // Protected Client
  { path: 'mis-citas', component: MisCitasComponent, canActivate: [authGuard], title: 'Mis Citas' },
  
  // Protected Admin
  { path: 'admin', children: [
    { path: '', component: DashboardComponent, title: 'Admin Dashboard' },
    { path: 'agenda', component: AgendaComponent, title: 'Admin Agenda' },
    { path: 'servicios', component: ServiciosComponent, title: 'Admin Servicios' },
    { path: 'disponibilidad', component: DisponibilidadComponent, title: 'Admin Disponibilidad' }
  ], canActivate: [adminGuard] },
  
  { path: '**', redirectTo: '' }
];
