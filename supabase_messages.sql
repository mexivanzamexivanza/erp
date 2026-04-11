-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor

create table if not exists message_channels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  type        text not null default 'general',
  created_at  timestamptz not null default now()
);

create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  channel_id   uuid not null references message_channels(id) on delete cascade,
  sender_email text not null,
  sender_name  text,
  body         text not null,
  is_system    boolean default false,
  created_at   timestamptz not null default now()
);

-- Seed default channels
insert into message_channels (name, description, type) values
  ('General',      'Company-wide announcements',   'general'),
  ('Ventas',       'Sales team channel',           'department'),
  ('Compras',      'Procurement team channel',     'department'),
  ('RR.HH.',       'Human resources channel',      'department'),
  ('Finanzas',     'Finance team channel',         'department'),
  ('Soporte IT',   'IT support and tech issues',   'department')
on conflict do nothing;

-- Enable realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_channels;