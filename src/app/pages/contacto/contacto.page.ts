import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnviaCorreoService } from '../../../services/envia-correo.service';

type FormStatus = 'idle' | 'loading' | 'success';

import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-contacto',
  imports: [ReactiveFormsModule, MatButtonModule],
  templateUrl: './contacto.page.html',
  styleUrl: './contacto.page.css'
})
export class ContactoPage {
  contactForm: FormGroup;
  formStatus: FormStatus = 'idle';

  constructor(
    private fb: FormBuilder,
    private enviaCorreoService: EnviaCorreoService
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      tratamientoDeseado: [''],
      mensaje: ['']
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.formStatus = 'loading';
    
    this.enviaCorreoService.enviarCorreo(this.contactForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.formStatus = 'success';
          this.contactForm.reset();
          
          // Volver a estado idle después de unos segundos
          setTimeout(() => {
            this.formStatus = 'idle';
          }, 5000);
        }
      },
      error: (err) => {
        console.error('Error enviando el correo', err);
        this.formStatus = 'idle';
      }
    });
  }
}
