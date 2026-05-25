import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EnviaCorreoService } from '../../../services/envia-correo.service';

type ModalView = 'options' | 'form' | 'loading' | 'success';

import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-reservation-modal',
  imports: [ReactiveFormsModule, MatButtonModule, RouterLink],
  templateUrl: './reservation-modal.component.html',
  styleUrl: './reservation-modal.component.css'
})
export class ReservationModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  currentView: ModalView = 'options';
  contactForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private enviaCorreoService: EnviaCorreoService
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      tratamientoDeseado: [''],
      mensaje: [''],
      privacidad: [false, Validators.requiredTrue]
    });
  }

  showForm() {
    this.currentView = 'form';
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.currentView = 'loading';
    
    this.enviaCorreoService.enviarCorreo(this.contactForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentView = 'success';
          this.contactForm.reset();
        }
      },
      error: (err) => {
        console.error('Error enviando el correo', err);
        // Volver al form si hay error para que el usuario pueda reintentar
        this.currentView = 'form';
      }
    });
  }

  onClose() {
    this.close.emit();
    // Restablecer la vista tras cerrar para la próxima vez
    setTimeout(() => {
      this.currentView = 'options';
      this.contactForm.reset();
    }, 300);
  }
}
