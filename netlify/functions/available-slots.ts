import { Handler } from '@netlify/functions';
import { calendar, CALENDAR_ID } from './utils/gcal';

// Business hours (Spanish Timezone - we do all calculations in local time for simplicity, then convert to UTC)
const BUSINESS_HOURS = [
  { start: '09:30', end: '13:30' },
  { start: '16:15', end: '20:15' }
];

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { date, duration } = event.queryStringParameters || {};

  if (!date || !duration) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing date or duration' }) };
  }

  const durationMin = parseInt(duration, 10);

  try {
    // We assume the date is YYYY-MM-DD
    // Create start and end of day in Europe/Madrid
    const timeZone = 'Europe/Madrid';
    
    // Using freebusy API
    const freeBusyReq = {
      timeMin: new Date(`${date}T00:00:00+01:00`).toISOString(), // Simplified offset, proper would use Moment-timezone
      timeMax: new Date(`${date}T23:59:59+01:00`).toISOString(),
      timeZone: timeZone,
      items: [{ id: CALENDAR_ID }]
    };

    // Note: if CALENDAR_ID is missing (not configured yet), return dummy slots so the UI doesn't break
    if (!CALENDAR_ID) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          slots: ['10:00', '11:00', '12:00', '17:00', '18:00'] // Dummy
        })
      };
    }

    const res = await calendar.freebusy.query({ requestBody: freeBusyReq });
    const busyIntervals = res.data.calendars?.[CALENDAR_ID]?.busy || [];

    // Convert busy intervals to HH:MM (Madrid time) for easy comparison
    const blocked = busyIntervals.map(b => {
      // In JS, passing an ISO string creates a Date. To get HH:MM in Madrid time natively is tricky.
      // For simplicity in this Serverless setup, we assume the server runs in UTC and we just use string manipulation or Intl
      const start = new Date(b.start as string);
      const end = new Date(b.end as string);
      
      const formatTime = (d: Date) => {
        return new Intl.DateTimeFormat('es-ES', { timeZone, hour: '2-digit', minute: '2-digit' }).format(d);
      };
      
      return {
        start: formatTime(start),
        end: formatTime(end)
      };
    });

    const slots: string[] = [];
    const interval = 15; // 15 min steps

    BUSINESS_HOURS.forEach(block => {
      let current = block.start;
      
      while (current < block.end) {
        const slotEnd = addMinutes(current, durationMin);
        
        if (slotEnd <= block.end) {
          // Check overlap
          const isBlocked = blocked.some(b => {
            return (current < b.end && slotEnd > b.start);
          });
          
          if (!isBlocked) {
            slots.push(current);
          }
        }
        current = addMinutes(current, interval);
      }
    });

    // Filter past slots if today
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone }); // YYYY-MM-DD
    const todayStr = formatter.format(now);
    
    if (date === todayStr) {
      const timeFormatter = new Intl.DateTimeFormat('es-ES', { timeZone, hour: '2-digit', minute: '2-digit' });
      const currentMinTime = timeFormatter.format(now);
      const validSlots = slots.filter(s => s > currentMinTime);
      return { statusCode: 200, body: JSON.stringify({ slots: validSlots }) };
    }

    return { statusCode: 200, body: JSON.stringify({ slots }) };

  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
