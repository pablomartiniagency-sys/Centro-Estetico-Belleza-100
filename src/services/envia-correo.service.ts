import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnviaCorreoService {

  constructor() { }

  /**
   * Simula el envío de un correo electrónico.
   * En el futuro, aquí se inyectará HttpClient y se hará un POST al backend.
   * @param datosContacto Los datos del formulario
   * @returns Un Observable que simula una respuesta del servidor tras 1.5s
   */
  enviarCorreo(datosContacto: any): Observable<{ success: boolean, message: string }> {
    console.log('Simulando envío de correo al servidor con datos:', datosContacto);
    
    // Simula un retardo de red de 1.5 segundos y devuelve un éxito
    return of({
      success: true,
      message: 'Correo enviado correctamente'
    }).pipe(delay(1500));
  }
}
