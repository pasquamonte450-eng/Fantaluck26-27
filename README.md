# Fantaluck — versione definitiva pronta per GitHub

## Cosa cambia
Questa versione non usa più `window.storage` di Claude Artifact.

- Frontend React/Vite
- Supabase predisposto come database condiviso
- Utenti salvati online
- Settimane salvate online
- Tentativi/classifica salvati online
- Pannello admin
- Responsive/mobile
- Fallback locale se Supabase non è ancora configurato

## 1. Crea Supabase
Crea un progetto su Supabase e apri **SQL Editor**.
Incolla tutto il file:

`supabase/schema.sql`

Eseguilo.

## 2. Inserisci le chiavi
Copia `.env.example` in `.env.local` e inserisci:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

Le trovi in Supabase nelle impostazioni API.

## 3. Avvio locale
Nel terminale:

npm install
npm run dev

## 4. Pubblicazione
Il progetto è pensato per essere messo su GitHub e pubblicato con GitHub Pages/Vercel.

IMPORTANTE:
Questa build mantiene il login username/password del prototipo per rendere semplice il passaggio iniziale. Prima di un uso reale con 90-100 persone, la fase successiva consigliata è migrare il login a Supabase Auth e applicare RLS per impedire a un partecipante di modificare utenti, settimane o tentativi altrui.

## Credenziali demo
admin / admin123
giocatore1 / start1

Cambiale prima dell'uso reale.
.
