-- Extensiones
create extension if not exists "pgcrypto";

-- Tabla profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text,
  duration_min integer not null check (duration_min > 0),
  buffer_before_min integer not null default 0 check (buffer_before_min >= 0),
  buffer_after_min integer not null default 0 check (buffer_after_min >= 0),
  price_cents integer,
  active boolean not null default true,
  display_order integer not null default 0,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ejemplos iniciales de servicios
insert into public.services
(slug, name, category, description, duration_min, buffer_before_min, buffer_after_min, price_cents, active, display_order)
values
('valoracion', 'Valoración inicial', 'Valoración', 'Primera valoración para recomendar el tratamiento adecuado.', 20, 0, 5, null, true, 1),
('limpieza-facial', 'Limpieza facial', 'Faciales', 'Tratamiento facial de limpieza y cuidado.', 60, 5, 10, null, true, 2),
('limpieza-facial-masaje', 'Limpieza facial + masaje', 'Faciales', 'Limpieza facial con momento relax.', 90, 5, 10, null, true, 3),
('lifting-pestanas', 'Lifting de pestañas', 'Cejas y pestañas', 'Tratamiento para elevar y definir pestañas.', 60, 5, 10, null, true, 4),
('laminado-cejas', 'Laminado de cejas', 'Cejas y pestañas', 'Diseño y laminado de cejas.', 45, 5, 10, null, true, 5),
('laser-zona-pequena', 'Láser zona pequeña', 'Láser', 'Depilación láser en zona pequeña.', 20, 0, 5, null, true, 6),
('laser-zona-media', 'Láser zona media', 'Láser', 'Depilación láser en zona media.', 30, 0, 10, null, true, 7),
('laser-zona-grande', 'Láser zona grande', 'Láser', 'Depilación láser en zona grande.', 60, 5, 10, null, true, 8),
('masaje-relajante', 'Masaje relajante', 'Masajes', 'Masaje relajante corporal.', 60, 5, 10, null, true, 9)
on conflict (slug) do nothing;

-- Tabla availability_rules (Horarios recurrentes)
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

-- Disponibilidad inicial de ejemplo
insert into public.availability_rules (weekday, start_time, end_time, active)
values
(1, '10:00', '14:00', true),
(1, '17:00', '20:00', true),
(2, '10:00', '14:00', true),
(2, '17:00', '20:00', true),
(3, '10:00', '14:00', true),
(3, '17:00', '20:00', true),
(4, '10:00', '14:00', true),
(4, '17:00', '20:00', true),
(5, '10:00', '14:00', true),
(5, '17:00', '20:00', true)
on conflict do nothing;

-- Tabla time_blocks (Bloqueos manuales)
create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

-- Tabla appointments (Citas)
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete set null,
  service_id uuid not null references public.services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled')
  ),
  source text not null default 'web' check (
    source in ('web', 'admin', 'instagram', 'facebook', 'google', 'whatsapp', 'booking_link')
  ),
  client_name text,
  client_email text,
  client_phone text,
  notes_client text,
  notes_private text,
  booking_token text,
  google_event_id text,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

-- Tabla booking_links (Enlaces personalizados)
create table if not exists public.booking_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  service_id uuid references public.services(id),
  client_id uuid references public.profiles(id),
  client_email text,
  client_name text,
  client_phone text,
  allowed_start_at timestamptz,
  allowed_end_at timestamptz,
  expires_at timestamptz,
  max_uses integer default 1,
  used_count integer not null default 0,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabla appointment_audit (Historial de cambios)
create table if not exists public.appointment_audit (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Tabla notification_outbox
create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'internal')),
  notification_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- SEGURIDAD: RLS Y POLÍTICAS

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.time_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.booking_links enable row level security;
alter table public.appointment_audit enable row level security;
alter table public.notification_outbox enable row level security;

-- Helper function: is_admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- Políticas de Profiles
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin());

-- Políticas de Services
create policy "services_select_active_or_admin"
on public.services for select
using (active = true or public.is_admin());

create policy "services_admin_all"
on public.services for all
using (public.is_admin())
with check (public.is_admin());

-- Políticas de Availability Rules
create policy "availability_select_all"
on public.availability_rules for select
using (true);

create policy "availability_admin_all"
on public.availability_rules for all
using (public.is_admin())
with check (public.is_admin());

-- Políticas de Time Blocks
create policy "time_blocks_select_admin"
on public.time_blocks for select
using (public.is_admin());

create policy "time_blocks_admin_all"
on public.time_blocks for all
using (public.is_admin())
with check (public.is_admin());

-- Políticas de Appointments
create policy "appointments_select_own_or_admin"
on public.appointments for select
using (client_id = auth.uid() or public.is_admin());

create policy "appointments_insert_authenticated"
on public.appointments for insert
with check (auth.uid() is not null);

create policy "appointments_update_own_or_admin"
on public.appointments for update
using (client_id = auth.uid() or public.is_admin());

-- Políticas de Booking Links
create policy "booking_links_admin_all"
on public.booking_links for all
using (public.is_admin())
with check (public.is_admin());

create policy "booking_links_public_select_active"
on public.booking_links for select
using (active = true);

-- Políticas de Audit
create policy "audit_admin_select"
on public.appointment_audit for select
using (public.is_admin());

-- Políticas de Outbox
create policy "outbox_admin_select"
on public.notification_outbox for select
using (public.is_admin());

-- RPC Helper para booking tokens
create or replace function public.increment_booking_token_use(p_token text)
returns void
language sql
security definer
as $$
  update public.booking_links
  set used_count = used_count + 1
  where token = p_token;
$$;

