import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './utils/supabase';

// Convert HH:MM time string to minutes
function timeToMinutes(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { serviceId, startsAt, source = 'web', bookingToken, notesClient, clientPhone } = body;

    if (!serviceId || !startsAt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // 1. Get user from Auth Header (JWT)
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    // 2. Fetch Service
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, name, duration_min, buffer_before_min, buffer_after_min, active')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service || !service.active) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or inactive service' }) };
    }

    // 3. Calculate ends_at
    const start = new Date(startsAt);
    const end = new Date(start);
    end.setUTCMinutes(end.getUTCMinutes() + service.duration_min);

    // TODO: Ideally we should re-validate availability here before inserting.
    // For MVP, we proceed to insert relying on Postgres constraints if we had unique constraints on time blocks.
    // In a production system, we'd do a quick overlap check here exactly like in available-slots.

    // 4. Insert Appointment
    const { data: appointment, error: insertError } = await supabaseAdmin
      .from('appointments')
      .insert([{
        client_id: user.id,
        service_id: service.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: 'confirmed',
        source: source,
        notes_client: notesClient,
        client_phone: clientPhone,
        created_by: user.id,
        client_email: user.email,
        client_name: user.user_metadata?.['full_name'] || user.email,
        booking_token: bookingToken
      }])
      .select()
      .single();

    if (insertError) {
      return { statusCode: 500, body: JSON.stringify({ error: insertError.message }) };
    }

    // 5. Handle Booking Token
    if (bookingToken) {
      await supabaseAdmin.rpc('increment_booking_token_use', { p_token: bookingToken });
    }

    // 6. Insert notification (WhatsApp/Email preparation)
    await supabaseAdmin.from('notification_outbox').insert([{
      appointment_id: appointment.id,
      channel: 'email',
      notification_type: 'confirmation',
      payload: { appointment }
    }]);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment })
    };

  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
