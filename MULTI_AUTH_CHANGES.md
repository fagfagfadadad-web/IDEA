# Multi-Auth System - Zoznam zmien

## Nové súbory

1. **src/lib/supabase.ts**
   - Supabase client konfigurácia
   - TypeScript typy pre databázu

2. **src/services/authService.ts**
   - Služba pre autentifikáciu
   - Podporuje Google, Wallet, Guest login
   - Wallet linking funkcionalita

3. **supabase_migration.sql**
   - Kompletná databázová schéma
   - RLS policies
   - Triggery a funkcie

4. **SUPABASE_SETUP.md**
   - Inštrukcie pre nastavenie
   - Dokumentácia

## Upravené súbory

1. **src/pages/Unlock/Unlock.tsx**
   - Nový UI s 3 možnosťami prihlásenia:
     - 🎮 Play as Guest
     - Pokračuj cez Google
     - 🔐 Connect MultiversX Wallet
   - Moderný gradient dizajn

2. **src/pages/Profile/Profile.tsx**
   - Pridaná sekcia "Link Wallet"
   - Tlačidlo pre prepojenie peňaženky
   - Zobrazenie wallet address ak je pripojený

3. **package.json**
   - Pridaná závislosť `@supabase/supabase-js`

## Ako to funguje

### Prihlásenie

**Hosť (Guest):**
- Klikni "Play as Guest" na login stránke
- Automaticky sa vytvorí anonymous účet
- Začínaš s 1000 food points a 5 tickets
- Progress sa ukladá

**Google:**
- Klikni "Continue with Google"
- OAuth flow cez Google
- Automaticky sa vytvorí profil
- Progress sa ukladá natrvalo

**MultiversX Wallet:**
- Klikni "Connect MultiversX Wallet"
- Otvorí sa wallet panel
- Pripojíš peňaženku
- Prístup k blockchain features

### Prepojenie peňaženky

Ak si začal ako hosť alebo cez Google:

1. Choď na **Profile** stránku
2. V sekcii "Wallet Address" uvidíš:
   - Ak nie je pripojená: Tlačidlo "Link Wallet"
3. Klikni na tlačidlo
4. Pripoj MultiversX peňaženku
5. Wallet sa prepojí s tvojím profilom

## Výhody Multi-Auth systému

✅ **Nižšia bariéra vstupu** - Môžeš hrať hneď ako hosť
✅ **Flexibilita** - Vyber si spôsob prihlásenia
✅ **Postupná migrácia** - Začni ako hosť, neskôr prepoj wallet
✅ **Ukladanie progressu** - Všetky metódy ukladajú dáta
✅ **Bezpečnosť** - Supabase RLS zabezpečí data

## Potrebné kroky pre deployment

1. ✅ Nainštalovať `@supabase/supabase-js` (DONE)
2. ⚠️ Spustiť `supabase_migration.sql` v Supabase
3. ⚠️ Nastaviť Google OAuth v Supabase dashboard
4. ✅ Environment premenné sú už nastavené
5. ✅ Build prebieha úspešne

## Databáza

Supabase databáza obsahuje:
- 6 hlavných tabuliek (profiles, game_stats, ships, tasks, user_tasks, game_plays)
- Row Level Security na všetkých tabuľkách
- Indexy pre rýchlejšie query
- Triggers pre auto-generovanie referral kódov
- Foreign keys pre integritu dát

## Nasledujúce kroky

1. Aplikovať SQL migráciu v Supabase
2. Nastaviť Google OAuth credentials
3. Otestovať všetky auth flow
4. Migrovať existujúce Firebase služby (optional)
5. Deploy aplikácie

## Poznámky

- Firebase je stále aktívne (pre kompatibilitu)
- Postupne môžeš migrovať na Supabase
- Build priečinok je pripravený na deployment
