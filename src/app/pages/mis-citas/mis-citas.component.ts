import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './mis-citas.component.html',
  styleUrls: ['./mis-citas.component.css']
})
export class MisCitasComponent implements OnInit {
  supabase = inject(SupabaseService);
  
  appointments: any[] = [];
  loading = true;

  async ngOnInit() {
    await this.loadAppointments();
  }

  async loadAppointments() {
    this.loading = true;
    const user = this.supabase.user;
    if (!user) {
      this.loading = false;
      return;
    }

    const { data, error } = await this.supabase.getClient()
      .from('appointments')
      .select('id, starts_at, ends_at, status, services(name, duration_min)')
      .eq('client_id', user.id)
      .order('starts_at', { ascending: true });

    if (data) {
      this.appointments = data;
    }
    this.loading = false;
  }

  async cancelAppointment(id: string) {
    if (!confirm('¿Estás segura de que deseas cancelar esta cita?')) return;

    const { data: { session } } = await this.supabase.getClient().auth.getSession();
    
    try {
      const res = await fetch('/.netlify/functions/cancel-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, reason: 'Cancelada por la clienta' })
      });

      if (!res.ok) throw new Error('Error canceling');
      alert('Cita cancelada con éxito');
      await this.loadAppointments();
    } catch (e) {
      alert('Error al cancelar la cita.');
    }
  }

  async logout() {
    await this.supabase.signOut();
    window.location.href = '/';
  }
}
