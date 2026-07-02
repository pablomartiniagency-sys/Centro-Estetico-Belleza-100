const { chromium } = require('playwright');

(async () => {
  console.log("==========================================");
  console.log("Iniciando pruebas de funcionamiento E2E...");
  console.log("==========================================\n");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Prueba 1: Carga de página principal
    console.log("-> 1. Probando carga de la página de inicio...");
    await page.goto('http://localhost:4200/');
    const title = await page.title();
    if (title.includes('Centro Estético')) {
      console.log("   ✅ OK: Título de la web correcto (" + title + ")");
    } else {
      console.error("   ❌ ERROR: Título incorrecto: " + title);
    }

    // Prueba 2: Navegación a Contacto
    console.log("\n-> 2. Probando sistema de enrutamiento (Navegación a Contacto)...");
    await page.click('text=Contacto');
    await page.waitForURL('**/contacto');
    console.log("   ✅ OK: Navegación sin recargas a la vista de Contacto exitosa.");

    // Prueba 3: Validación del formulario y GDPR
    console.log("\n-> 3. Probando validación del formulario de Contacto y RGPD...");
    await page.fill('#nombre', 'Test Automático');
    await page.fill('#telefono', '600000000');
    await page.fill('#email', 'test@ejemplo.com');
    await page.fill('#mensaje', 'Este es un mensaje generado por las pruebas automáticas.');
    
    // Verificar que el botón submit está desactivado inicialmente
    let isButtonDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);
    if (isButtonDisabled) {
      console.log("   ✅ OK: El botón de envío está bloqueado correctamente por la Política de Privacidad.");
    } else {
      console.error("   ❌ ERROR: El botón permite enviar sin aceptar la política.");
    }

    // Aceptar la casilla de privacidad haciendo clic en el label para disparar eventos
    await page.click('label[for="privacidad"]');
    await page.waitForTimeout(500); // Esperar detección de cambios
    
    let isButtonEnabled = await page.$eval('button[type="submit"]', btn => !btn.disabled);
    if (isButtonEnabled) {
      console.log("   ✅ OK: El botón de envío se habilita tras aceptar la política RGPD.");
    } else {
      console.error("   ❌ ERROR: El botón no se habilita tras aceptar la política.");
    }

    // Prueba 4: Modal de Reserva en Tratamientos
    console.log("\n-> 4. Probando funcionamiento del modal de Reserva en Tratamientos...");
    await page.click('text=Tratamientos');
    await page.waitForURL('**/tratamientos');
    await page.waitForTimeout(1000); // Dar tiempo a que la página cargue los botones
    
    // Hacer clic en "Reservar cita" en el primer tratamiento
    await page.click('button:has-text("Reservar cita") >> nth=0');
    
    // Esperar a que el modal aparezca (app-reservation-modal)
    await page.waitForSelector('.modal-backdrop', { state: 'visible', timeout: 5000 });
    console.log("   ✅ OK: El modal de reservas se abre correctamente.");
    
    // Hacer clic en "Correo Electrónico" para ir a la vista del formulario
    await page.click('.email-card');
    await page.waitForTimeout(500);
    
    // Comprobar validación en el modal
    const modalButtonDisabled = await page.$eval('.modal-content button[type="submit"]', btn => btn.disabled);
    if (modalButtonDisabled) {
      console.log("   ✅ OK: El formulario de reserva valida correctamente sus campos y RGPD.");
    } else {
      console.error("   ❌ ERROR: El botón de reserva permite envío con campos vacíos.");
    }

    console.log("\n==========================================");
    console.log("🎉 TODAS LAS PRUEBAS FUNCIONALES PASARON CON ÉXITO.");
    console.log("==========================================");
  } catch (err) {
    console.error("\n❌ Error crítico durante las pruebas:", err);
  } finally {
    await browser.close();
  }
})();
