import { Handler } from '@netlify/functions';
import { supabaseAdmin } from './utils/supabase';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    const body = JSON.parse(event.body || '{}');
    const { id, reason } = body;

    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing appointment ID' }) };

    const { data: appointment } = await supabaseAdmin.from('appointments').select('*').eq('id', id).single();
    if (!appointment) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };

    if (!isAdmin && appointment.client_id !== user.id) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const { data: updated, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    await supabaseAdmin.from('appointment_audit').insert([{
      appointment_id: id,
      action: 'cancelled',
      old_data: appointment,
      new_data: updated,
      actor_id: user.id
    }]);

    await supabaseAdmin.from('notification_outbox').insert([{
      appointment_id: id,
      channel: 'email',
      notification_type: 'cancellation',
      payload: { appointment: updated }
    }]);

    return { statusCode: 200, body: JSON.stringify({ appointment: updated }) };

  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
