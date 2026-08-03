-- Stay Operations Dashboard schema
-- Run this in the Supabase SQL editor (or `supabase db push`) before seed.sql.
-- RLS is enabled with no policies: only the server-side service role key
-- (used exclusively inside Next.js Route Handlers) can read/write these tables.

create extension if not exists pgcrypto;

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('cleaner', 'facility', 'manager')),
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  room_number text not null,
  status text not null default 'ready'
    check (status in ('occupied', 'dirty', 'assigned', 'cleaning', 'inspection', 'issue', 'ready')),
  checkout_at timestamptz,
  next_checkin_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch, room_number)
);

create table cleaning_tasks (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  status text not null default 'unassigned'
    check (status in ('unassigned', 'assigned', 'cleaning', 'inspection', 'done')),
  assignee_id uuid references staff(id),
  estimated_minutes int not null default 45,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  category text not null
    check (category in ('cleaning', 'facility', 'access', 'amenity', 'environment', 'other')),
  description text not null,
  reporter_type text not null check (reporter_type in ('guest', 'cleaner', 'manager', 'facility')),
  urgency text not null default 'normal' check (urgency in ('low', 'normal', 'urgent')),
  status text not null default 'new'
    check (status in ('new', 'checking', 'assigned', 'in_progress', 'inspection', 'done')),
  assignee_id uuid references staff(id),
  ai_suggested_category text,
  ai_suggested_urgency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cleaning_tasks_room_id_idx on cleaning_tasks(room_id);
create index issues_room_id_idx on issues(room_id);

alter table staff enable row level security;
alter table rooms enable row level security;
alter table cleaning_tasks enable row level security;
alter table issues enable row level security;
