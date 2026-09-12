-- ============================================================
-- FANTALUCK — schema corretto (Fase 1: Auth + RLS + colonne mancanti)
-- Incolla questo script nell'SQL Editor del progetto Supabase.
-- ATTENZIONE: sostituisce lo schema attuale. Se hai già dati reali
-- in produzione, valuta una migrazione incrementale invece di
-- eseguire tutto da zero.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILI (sostituisce la tabella "users" con password in chiaro)
-- ------------------------------------------------------------
-- Gli account si creano tramite Supabase Auth (non più con una riga
-- inserita a mano con password in chiaro). L'admin crea gli utenti
-- dalla dashboard Supabase (Authentication > Users > Add user) o via
-- Admin API, impostando user_metadata: { "username": "...", "name": "...", "role": "admin"|"participant" }

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null,
  role text not null default 'participant' check (role in ('admin','participant'))
);

alter table public.profiles enable row level security;

-- Funzione helper: bypassa la RLS di "profiles" perché è SECURITY DEFINER
-- e di proprietà del ruolo owner (postgres), che per default non è
-- soggetto alle policy della tabella. Evita la ricorsione infinita che
-- si otterrebbe interrogando "profiles" dentro una policy di "profiles".
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_username()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select username from public.profiles where id = auth.uid();
$$;

-- Trigger: alla creazione di un utente in auth.users, crea la riga
-- corrispondente in profiles leggendo i metadata passati in fase di
-- creazione account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email),
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'participant')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());


-- ------------------------------------------------------------
-- 2. SETTIMANE (con le colonne mancanti nello schema attuale)
-- ------------------------------------------------------------

create table if not exists public.weeks (
  id text primary key,
  number integer not null,
  status text not null default 'draft',
  starts_at timestamptz,                 -- mancava
  deadline timestamptz,
  "matchQuestions" jsonb not null default '[]'::jsonb,
  "playerQuestions" jsonb not null default '[]'::jsonb,
  "rigoriCells" integer not null default 12,
  "multiplierBase" numeric not null default 1,
  "multiplierStep" numeric not null default 0.15,
  results_published boolean not null default false  -- mancava
);

alter table public.weeks enable row level security;

-- Solo l'admin legge/scrive la tabella grezza (contiene le risposte corrette).
drop policy if exists "weeks_admin_all" on public.weeks;
create policy "weeks_admin_all" on public.weeks
  for all using (public.is_admin()) with check (public.is_admin());

-- Rimuove la vecchia policy aperta, se presente.
drop policy if exists "weeks_all" on public.weeks;

-- Funzione: toglie la chiave "correct" da ogni domanda di un array jsonb.
create or replace function public.strip_correct(qs jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(elem - 'correct'), '[]'::jsonb)
  from jsonb_array_elements(qs) as elem
$$;

-- View pubblica: quello che legge il frontend dei partecipanti.
-- Le risposte corrette sono visibili SOLO dopo la pubblicazione
-- dei risultati (serve per la revisione delle risposte in classifica).
create or replace view public.weeks_public
with (security_invoker = false) as
select
  w.id,
  w.number,
  w.status,
  w.starts_at,
  w.deadline,
  case when w.results_published
    then w."matchQuestions"
    else public.strip_correct(w."matchQuestions")
  end as "matchQuestions",
  case when w.results_published
    then w."playerQuestions"
    else public.strip_correct(w."playerQuestions")
  end as "playerQuestions",
  w."rigoriCells",
  w."multiplierBase",
  w."multiplierStep",
  w.results_published
from public.weeks w;

grant select on public.weeks_public to authenticated, anon;


-- ------------------------------------------------------------
-- 3. PARTECIPAZIONI
-- ------------------------------------------------------------

create table if not exists public.attempts (
  id text primary key,
  week_id text not null references public.weeks(id) on delete cascade,
  username text not null references public.profiles(username) on delete cascade,
  name text,
  match_answers jsonb not null default '[]'::jsonb,
  player_answers jsonb not null default '[]'::jsonb,
  rigori_result jsonb not null default '{}'::jsonb,
  base_score integer not null default 0,
  correct_answers integer not null default 0,
  goals integer not null default 0,
  multiplier numeric not null default 1,
  final_score integer not null default 0,
  results_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (week_id, username)
);

alter table public.attempts enable row level security;

-- Un partecipante legge solo la propria partecipazione...
drop policy if exists "attempts_select_own" on public.attempts;
create policy "attempts_select_own" on public.attempts
  for select using (username = public.current_username());

-- ...oppure tutte, ma solo una volta pubblicati i risultati (classifica).
drop policy if exists "attempts_select_published" on public.attempts;
create policy "attempts_select_published" on public.attempts
  for select using (
    exists (
      select 1 from public.weeks w
      where w.id = attempts.week_id and w.results_published = true
    )
  );

-- L'admin gestisce tutto (inserimento punteggi, pubblicazione, ecc.)
drop policy if exists "attempts_admin_all" on public.attempts;
create policy "attempts_admin_all" on public.attempts
  for all using (public.is_admin()) with check (public.is_admin());

-- Rimuove la vecchia policy aperta, se presente.
drop policy if exists "attempts_all" on public.attempts;

-- NOTA IMPORTANTE:
-- Qui NON c'è una policy "insert" per i partecipanti. Di proposito.
-- Se un partecipante potesse fare INSERT diretto sulla propria riga,
-- potrebbe comunque scrivere il "final_score" o il "multiplier" che
-- vuole, perché il check RLS può solo verificare la proprietà della
-- riga (username), non calcolare se il punteggio è corretto.
--
-- La scrittura degli attempts avviene quindi SOLO tramite una Edge
-- Function lato server, che usa la service_role key (bypassa la RLS)
-- dopo aver ricalcolato punteggio e risultato rigori in modo
-- indipendente da quello che manda il client. Questo è oggetto della
-- Fase 2.


-- ------------------------------------------------------------
-- 4. TABELLA VECCHIA "users": da eliminare dopo la migrazione
-- ------------------------------------------------------------
-- Non la droppo automaticamente per sicurezza (potresti avere dati da
-- migrare a mano su "profiles"/Auth). Quando hai finito la migrazione:
--
-- drop table if exists public.users;
