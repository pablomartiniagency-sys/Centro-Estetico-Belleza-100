import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration_min: number;
  description: string;
  price_cents: number | null;
}

@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  templateUrl: './reservar.component.html',
  styleUrls: ['./reservar.component.css']
})
export class ReservarComponent implements OnInit {
  supabase = inject(SupabaseService);

  services: ServiceItem[] = [];
  categories: string[] = [];
  selectedCategory: string | null = null;
  selectedService: ServiceItem | null = null;
  
  selectedDate: Date | null = null;
  minDate = new Date(); // Can't book in the past
  maxDate = new Date();

  availableSlots: string[] = [];
  selectedSlot: string | null = null;

  loadingServices = true;
  loadingSlots = false;
  bookingInProgress = false;

  user = this.supabase.user;
  profile = this.supabase.profile;

  constructor() {
    this.maxDate.setDate(this.maxDate.getDate() + 60); // Max booking days ahead = 60
  }

  ngOnInit() {
    this.loadServices();
    
    // Subscribe to auth state so we know if user logs in
    this.supabase.currentUser$.subscribe(user => {
      this.user = user;
    });
    this.supabase.currentProfile$.subscribe(prof => {
      this.profile = prof;
    });
  }

  async loadServices() {
    this.loadingServices = true;
    const { data, error } = await this.supabase.getClient()
      .from('services')
      .select('id, name, category, duration_min, description, price_cents')
      .eq('active', true)
      .order('display_order');
      
    if (data) {
      this.services = data;
      const cats = new Set(data.map(s => s.category));
      this.categories = Array.from(cats);
    }
    this.loadingServices = false;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.selectedService = null;
    this.selectedDate = null;
    this.selectedSlot = null;
    this.availableSlots = [];
  }

  selectService(srv: ServiceItem) {
    this.selectedService = srv;
    this.selectedDate = null;
    this.selectedSlot = null;
    this.availableSlots = [];
  }

  async onDateChange(date: Date | null) {
    this.selectedDate = date;
    this.selectedSlot = null;
    this.availableSlots = [];
    
    if (date && this.selectedService) {
      await this.loadAvailableSlots(this.selectedService.id, date);
    }
  }

  async loadAvailableSlots(serviceId: string, date: Date) {
    this.loadingSlots = true;
    
    try {
      // Format YYYY-MM-DD
      const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      
      const res = await fetch(`/.netlify/functions/available-slots?serviceId=${serviceId}&date=${dateStr}`);
      if (!res.ok) throw new Error('Error fetching slots');
      const data = await res.json();
      this.availableSlots = data.slots || [];
    } catch (e) {
      console.error(e);
      // Fallback in case backend is missing/failing
      this.availableSlots = [];
    } finally {
      this.loadingSlots = false;
    }
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
  }

  async loginWithGoogle() {
    await this.supabase.signInWithGoogle();
  }

  async confirmBooking() {
    if (!this.user) {
      // Show login modal or alert
      alert('Debes iniciar sesión para confirmar tu reserva.');
      return;
    }

    if (!this.selectedService || !this.selectedDate || !this.selectedSlot) return;

    this.bookingInProgress = true;

    try {
      // Parse startsAt
      const dateStr = this.selectedDate.getFullYear() + '-' + String(this.selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(this.selectedDate.getDate()).padStart(2, '0');
      const startsAt = new Date(`${dateStr}T${this.selectedSlot}:00Z`).toISOString(); // Simple timezone handling for MVP

      const { data: { session } } = await this.supabase.getClient().auth.getSession();

      const res = await fetch('/.netlify/functions/create-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          serviceId: this.selectedService.id,
          startsAt: startsAt,
          source: 'web'
        })
      });

      if (!res.ok) throw new Error('Error booking appointment');
      
      alert('¡Tu cita ha sido confirmada!');
      // Reset form or navigate to /mis-citas
      window.location.href = '/mis-citas';

    } catch(e: any) {
      console.error(e);
      alert('Ocurrió un error al confirmar la cita. Por favor, inténtalo de nuevo.');
    } finally {
      this.bookingInProgress = false;
    }
  }
}
