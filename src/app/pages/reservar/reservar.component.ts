import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService, ServiceItem } from '../../core/services/booking.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

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
  bookingService = inject(BookingService);

  services: ServiceItem[] = [];
  categories: string[] = [];
  selectedCategory: string | null = null;
  selectedService: ServiceItem | null = null;
  
  selectedDate: Date | null = null;
  minDate = new Date();
  maxDate = new Date();

  availableSlots: string[] = [];
  selectedSlot: string | null = null;

  // Formulario cliente
  clientName = '';
  clientPhone = '';
  clientEmail = '';

  loadingServices = true;
  loadingSlots = false;
  bookingInProgress = false;
  bookingSuccess = false;

  constructor() {
    this.maxDate.setDate(this.maxDate.getDate() + 60);
  }

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.loadingServices = true;
    this.bookingService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        const cats = new Set(data.map(s => s.category));
        this.categories = Array.from(cats);
        this.loadingServices = false;
      },
      error: (err) => {
        console.error('Error loading services', err);
        this.loadingServices = false;
      }
    });
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
      await this.loadAvailableSlots(this.selectedService.duration_min, date);
    }
  }

  async loadAvailableSlots(duration: number, date: Date) {
    this.loadingSlots = true;
    try {
      const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const res = await fetch(`/.netlify/functions/available-slots?duration=${duration}&date=${dateStr}`);
      if (!res.ok) throw new Error('Error fetching slots');
      const data = await res.json();
      this.availableSlots = data.slots || [];
    } catch (e) {
      console.error(e);
      this.availableSlots = [];
    } finally {
      this.loadingSlots = false;
    }
  }

  selectSlot(slot: string) {
    this.selectedSlot = slot;
  }

  async confirmBooking() {
    if (!this.selectedService || !this.selectedDate || !this.selectedSlot) return;
    if (!this.clientName || !this.clientPhone) {
      alert('Por favor, rellena tu nombre y teléfono.');
      return;
    }

    this.bookingInProgress = true;

    try {
      const dateStr = this.selectedDate.getFullYear() + '-' + String(this.selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(this.selectedDate.getDate()).padStart(2, '0');

      const res = await fetch('/.netlify/functions/create-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: this.selectedService.name,
          duration: this.selectedService.duration_min,
          date: dateStr,
          time: this.selectedSlot,
          clientName: this.clientName,
          clientPhone: this.clientPhone,
          clientEmail: this.clientEmail
        })
      });

      if (!res.ok) throw new Error('Error booking appointment');
      
      this.bookingSuccess = true;

    } catch(e: any) {
      console.error(e);
      alert('Ocurrió un error al confirmar la cita. Por favor, inténtalo de nuevo.');
    } finally {
      this.bookingInProgress = false;
    }
  }
}
