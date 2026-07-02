import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout" style="display: flex; min-height: 100vh;">
      <aside style="width: 250px; background: #333; color: white; padding: 2rem;">
        <h2>Admin</h2>
        <nav style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
          <a routerLink="/admin" style="color: white; text-decoration: none;">Dashboard</a>
          <a routerLink="/admin/agenda" style="color: white; text-decoration: none;">Agenda</a>
          <a routerLink="/admin/servicios" style="color: white; text-decoration: none;">Servicios</a>
          <a routerLink="/admin/disponibilidad" style="color: white; text-decoration: none;">Disponibilidad</a>
          <a routerLink="/" style="color: #aaa; text-decoration: none; margin-top: 2rem;">← Volver a la web</a>
        </nav>
      </aside>
      <main style="flex: 1; padding: 2rem; background: #f5f5f5;">
        <h1>Panel de Control</h1>
        <p>Bienvenida, Carmen. Desde aquí puedes gestionar las reservas y configuración del centro.</p>
      </main>
    </div>
  `
})
export class DashboardComponent {}
