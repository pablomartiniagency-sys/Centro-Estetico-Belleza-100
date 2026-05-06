import { Component } from '@angular/core';
import { ReservationModalComponent } from '../../components/reservation-modal/reservation-modal.component';
import { GsapHoverDirective } from '../../directives/gsap-hover.directive';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-tratamientos',
  imports: [ReservationModalComponent, GsapHoverDirective, MatButtonModule],
  templateUrl: './tratamientos.page.html',
  styleUrl: './tratamientos.page.css'
})
export class TratamientosPage {
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
