import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration_min: number;
  description: string;
  price_cents: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(private http: HttpClient) {}

  getServices(): Observable<ServiceItem[]> {
    return this.http.get<ServiceItem[]>('/assets/data/services.json');
  }
}
