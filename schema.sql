-- FANTALUCK: database condiviso
-- Incolla questo script nell'SQL Editor del tuo progetto Supabase.

create table if not exists public.users (
  username text primary key,
  password text not null,
  role text not null default 'participant' check (role in ('admin','participant')),
  name text not null
);

create table if not exists public.weeks (
  id text primary key,
  number integer not null,
  status text not null default 'draft',
  deadline timestamptz,
  "matchQuestions" jsonb not null default '[]'::jsonb,
  "playerQuestions" jsonb not null default '[]'::jsonb,
  "rigoriCells" integer not null default 12,
  "multiplierBase" numeric not null default 1,
  "multiplierStep" numeric not null default 0.0375
);

create table if not exists public.attempts (
  id text primary key,
  week_id text not null references public.weeks(id) on delete cascade,
  username text not null references public.users(username) on delete cascade,
  name text,
  base_score integer not null default 0,
  correct_answers integer not null default 0,
  goals integer not null default 0,
  multiplier numeric not null default 1,
  final_score integer not null default 0,
  created_at timestamptz not null default now(),
  unique(week_id, username)
);

alter table public.users enable row level security;
alter table public.weeks enable row level security;
alter table public.attempts enable row level security;

-- VERSIONE PROTOTIPO:
-- permette al frontend anonimo di leggere/scrivere.
-- Prima di usare il sito per un torneo reale conviene sostituire questa
-- parte con Supabase Auth + policy basate sul ruolo.

drop policy if exists "users_all" on public.users;
create policy "users_all" on public.users for all using (true) with check (true);

drop policy if exists "weeks_all" on public.weeks;
create policy "weeks_all" on public.weeks for all using (true) with check (true);

drop policy if exists "attempts_all" on public.attempts;
create policy "attempts_all" on public.attempts for all using (true) with check (true);

insert into public.users(username,password,role,name)
values
('admin','admin123','admin','Organizzatore'),
('giocatore1','start1','participant','Giocatore 1')
on conflict (username) do nothing;
