import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnviaCorreoService {
  // TODO: Reemplazar con el endpoint real de Formspree o tu backend
  private endpointUrl = 'https://formspree.io/f/YOUR_FORM_ID_HERE';

  constructor(private http: HttpClient) { }

  /**
   * Envía un correo electrónico mediante Formspree u otro servicio externo.
   * @param datosContacto Los datos del formulario
   * @returns Un Observable con la respuesta
   */
  enviarCorreo(datosContacto: any): Observable<{ success: boolean, message: string }> {
    // Si no has configurado Formspree aún, podemos simular la respuesta
    if (this.endpointUrl.includes('YOUR_FORM_ID_HERE')) {
      console.warn('Formspree endpoint no configurado. Simulando envío...');
      return of({ success: true, message: 'Simulado' });
    }

    return this.http.post<any>(this.endpointUrl, datosContacto).pipe(
      map(() => ({ success: true, message: 'Correo enviado correctamente' })),
      catchError((err) => {
        console.error('Error enviando el correo', err);
        return of({ success: false, message: 'Error al enviar el correo' });
      })
    );
  }
}
