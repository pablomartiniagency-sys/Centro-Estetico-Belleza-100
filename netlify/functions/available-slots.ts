import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './utils/supabase';

// Helper to add minutes to a time string (HH:MM)
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

// Convert "YYYY-MM-DDTHH:MM..." to "HH:MM"
function toTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { serviceId, date } = event.queryStringParameters || {};

  if (!serviceId || !date) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing serviceId or date' }) };
  }

  try {
    // 1. Get Service
    const { data: service, error: sErr } = await supabaseAdmin
      .from('services')
      .select('duration_min, buffer_before_min, buffer_after_min')
      .eq('id', serviceId)
      .single();

    if (sErr || !service) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Service not found' }) };
    }

    const { duration_min, buffer_before_min, buffer_after_min } = service;
    const totalSlotMins = duration_min + buffer_before_min + buffer_after_min;

    // 2. Get day of week (0 = Sunday, 1 = Monday, ...)
    const targetDate = new Date(date);
    const weekday = targetDate.getDay();

    // 3. Get Availability Rules for that weekday
    const { data: rules } = await supabaseAdmin
      .from('availability_rules')
      .select('start_time, end_time')
      .eq('weekday', weekday)
      .eq('active', true);

    if (!rules || rules.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ slots: [] }) };
    }

    // 4. Get active appointments for that day
    // We search from start of day to end of day in UTC
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('starts_at, ends_at, services(buffer_before_min, buffer_after_min)')
      .in('status', ['pending', 'confirmed', 'rescheduled'])
      .gte('starts_at', startOfDay.toISOString())
      .lte('ends_at', endOfDay.toISOString());

    // 5. Get time blocks
    const { data: blocks } = await supabaseAdmin
      .from('time_blocks')
      .select('starts_at, ends_at')
      .eq('active', true)
      .gte('starts_at', startOfDay.toISOString())
      .lte('ends_at', endOfDay.toISOString());

    // Merge block times
    const blockedIntervals: { start: string, end: string }[] = [];

    if (appointments) {
      appointments.forEach(app => {
        // We calculate real blocked time based on the app's service buffers
        const dStart = new Date(app.starts_at);
        const dEnd = new Date(app.ends_at);
        
        // Add existing buffers (approximation, assuming they have buffers loaded, or default to 0 if nested join fails)
        const bBefore = app.services?.buffer_before_min || 0;
        const bAfter = app.services?.buffer_after_min || 0;

        dStart.setUTCMinutes(dStart.getUTCMinutes() - bBefore);
        dEnd.setUTCMinutes(dEnd.getUTCMinutes() + bAfter);

        blockedIntervals.push({
          start: toTime(dStart.toISOString()),
          end: toTime(dEnd.toISOString())
        });
      });
    }

    if (blocks) {
      blocks.forEach(b => {
        blockedIntervals.push({
          start: toTime(b.starts_at),
          end: toTime(b.ends_at)
        });
      });
    }

    // 6. Generate 15-min slots within availability rules
    const slots: string[] = [];
    const interval = 15;

    rules.forEach(rule => {
      let current = rule.start_time.substring(0, 5); // "HH:MM"
      const endLimit = rule.end_time.substring(0, 5);

      while (current < endLimit) {
        // Calculate when this potential slot would end (including buffers)
        const slotEnd = addMinutes(current, totalSlotMins);

        if (slotEnd <= endLimit) {
          // Check overlap with blocked intervals
          const isBlocked = blockedIntervals.some(b => {
            // Check if (current < b.end) AND (slotEnd > b.start)
            // But we must also account for the new appointment's buffers!
            // Actual treatment start = current + buffer_before
            // Actual treatment end = current + buffer_before + duration
            // But for booking, the entire totalSlotMins block must not overlap.
            return (current < b.end && slotEnd > b.start);
          });

          if (!isBlocked) {
            // Return the REAL start time of the treatment for the user
            const treatmentStart = addMinutes(current, buffer_before_min);
            if (!slots.includes(treatmentStart)) {
              slots.push(treatmentStart);
            }
          }
        }
        
        current = addMinutes(current, interval);
      }
    });

    // 7. Sort and return
    slots.sort();

    // Filter out past slots if date is today
    const now = new Date();
    if (targetDate.toDateString() === now.toDateString()) {
      const currentMinTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      return {
        statusCode: 200,
        body: JSON.stringify({ slots: slots.filter(s => s > currentMinTime) })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots })
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
