import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './utils/supabase';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };

    // Get user role
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    const body = JSON.parse(event.body || '{}');
    const { id, startsAt, serviceId } = body;

    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing appointment ID' }) };

    // Fetch existing
    const { data: appointment } = await supabaseAdmin.from('appointments').select('*').eq('id', id).single();
    if (!appointment) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };

    if (!isAdmin && appointment.client_id !== user.id) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    // Prepare update payload
    let updatePayload: any = {};
    if (startsAt && serviceId) {
       const { data: service } = await supabaseAdmin.from('services').select('duration_min').eq('id', serviceId).single();
       if (service) {
         const start = new Date(startsAt);
         const end = new Date(start);
         end.setUTCMinutes(end.getUTCMinutes() + service.duration_min);
         updatePayload.starts_at = start.toISOString();
         updatePayload.ends_at = end.toISOString();
         updatePayload.service_id = serviceId;
       }
    }

    const { data: updated, error } = await supabaseAdmin
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    // Audit
    await supabaseAdmin.from('appointment_audit').insert([{
      appointment_id: id,
      action: 'rescheduled',
      old_data: appointment,
      new_data: updated,
      actor_id: user.id
    }]);

    return { statusCode: 200, body: JSON.stringify({ appointment: updated }) };

  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
