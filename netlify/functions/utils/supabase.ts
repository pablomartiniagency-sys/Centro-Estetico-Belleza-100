import { createClient } from '@supabase/supabase-js';

// We use the SERVICE_ROLE_KEY for admin tasks in the backend (Netlify Functions)
// WARNING: Never expose this key to the frontend.
const supabaseUrl = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || '';
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'] || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
