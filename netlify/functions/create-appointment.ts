import { Handler } from '@netlify/functions';
import { calendar, CALENDAR_ID } from './utils/gcal';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { serviceName, duration, date, time, clientName, clientPhone, clientEmail } = body;

    if (!serviceName || !duration || !date || !time || !clientName || !clientPhone) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Convert date + time to ISO strings
    // date: "YYYY-MM-DD", time: "HH:MM"
    const startDateTime = `${date}T${time}:00`;
    
    // Calculate end time
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + parseInt(duration, 10);
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    const endDateTime = `${date}T${endTime}:00`;

    const eventResource = {
      summary: `Cita Web: ${clientName} - ${serviceName}`,
      description: `Servicio: ${serviceName}\nCliente: ${clientName}\nTeléfono: ${clientPhone}\nEmail: ${clientEmail || 'No proporcionado'}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Madrid',
      },
      colorId: '2', // Optional color
    };

    if (!CALENDAR_ID) {
      console.log('Dummy Event Created:', eventResource);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, dummy: true })
      };
    }

    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: eventResource,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, eventId: res.data.id })
    };

  } catch (error: any) {
    console.error('Error creating event:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
