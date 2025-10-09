# Supabase Multi-Auth Setup Guide

PupFi teraz podporuje viacero spôsobov prihlásenia:
- 🎮 **Hrať ako hosť** (bez registrácie)
- 🔐 **Google prihlásenie** (uloží sa progress)
- 💎 **MultiversX peňaženka** (blockchain features)

## Nastavenie Supabase databázy

### 1. Spustenie Supabase migrácie

V root priečinku projektu nájdeš súbor `supabase_migration.sql`. Tento SQL skript obsahuje všetky potrebné tabuľky a pravidlá pre multi-auth systém.

**Postup:**

1. Otvor Supabase dashboard na https://supabase.com/dashboard
2. Vyber svoj projekt (ak nemáš, vytvor nový)
3. Choď do **SQL Editor** v ľavom menu
4. Vytvor **New query**
5. Skopíruj celý obsah `supabase_migration.sql` do editora
6. Stlač **Run** (alebo Ctrl+Enter)

### 2. Konfigurácia Google OAuth

Pre Google prihlásenie musíš nastaviť OAuth v Supabase:

1. V Supabase dashboard choď na **Authentication** > **Providers**
2. Nájdi **Google** v zozname providerov
3. Zapni **Enable Sign in with Google**
4. Potrebuješ nastaviť:
   - **Client ID** (z Google Cloud Console)
   - **Client Secret** (z Google Cloud Console)

**Získanie Google OAuth credentials:**

1. Choď na https://console.cloud.google.com/
2. Vytvor nový projekt alebo vyber existujúci
3. Zapni **Google+ API**
4. Choď na **Credentials** > **Create Credentials** > **OAuth Client ID**
5. Vyber **Web application**
6. Pridaj **Authorized redirect URI**:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
7. Skopíruj **Client ID** a **Client Secret** do Supabase

### 3. Environment premenné

Uisti sa, že máš správne nastavené tieto premenné v `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Databázová štruktúra

### Tabuľky

1. **profiles** - Profily používateľov
   - Podporuje viacero auth metód (guest, google, wallet)
   - Ukladá základné info (username, avatar, bio)
   - Možnosť prepojiť peňaženku neskôr

2. **game_stats** - Herné štatistiky
   - PupFi tokens (food points)
   - Game tickets
   - Mining level a experience
   - Referral systém

3. **ships** - Psíky používateľa
   - Level, power, energy
   - Mining stats

4. **tasks** - Úlohy a odmeny
   - Daily/weekly tasks
   - Reward systém

5. **user_tasks** - Progress úloh
   - Sledovanie completion

6. **game_plays** - Ticket systém
   - Tracking kedy hráč hral hry

## Ako funguje Multi-Auth

### 1. Hosť (Guest)
```typescript
await AuthService.signInAsGuest();
```
- Vytvorí anonymous Supabase session
- Profil označený ako `is_guest = true`
- Môže hrať hry a zbierať food points
- Neskôr môže upgradovať účet

### 2. Google prihlásenie
```typescript
await AuthService.signInWithGoogle();
```
- OAuth flow cez Google
- Automaticky vytvorí profil s emailom
- Uloží sa progress natrvalo

### 3. MultiversX peňaženka
```typescript
await AuthService.signInWithWallet(address);
```
- Prepojí peňaženku s profilom
- Umožní blockchain transakcie
- Môže sa prepojiť aj s existujúcim Google účtom

### 4. Prepojenie peňaženky
Používateľ môže začať ako hosť alebo cez Google a neskôr prepojiť peňaženku:

```typescript
await AuthService.linkWalletToProfile(userId, walletAddress);
```

## Row Level Security (RLS)

Všetky tabuľky majú aktívne RLS policies:
- Používatelia vidia len svoje dáta
- Anonymní používatelia majú obmedzený prístup
- Admini majú špeciálne práva

## Príklady použitia

### Získanie profilu
```typescript
const profile = await AuthService.getCurrentProfile();
```

### Kontrola prihlásenia
```typescript
const isAuth = await AuthService.isAuthenticated();
```

### Odhlásenie
```typescript
await AuthService.signOut();
```

## Migrácia z Firebase

Ak máš existujúce Firebase dáta, budeš potrebovať:

1. Exportovať dáta z Firestore
2. Transformovať na Supabase formát
3. Importovať do Supabase

Firebase services (`userService.ts`, `gameService.ts`) môžeš postupne nahradiť Supabase službami.

## Testovanie

Po nastavení otestuj všetky flow:

1. ✅ Hosť prihlásenie
2. ✅ Google prihlásenie
3. ✅ Wallet pripojenie
4. ✅ Prepojenie wallet + Google účtu
5. ✅ Ukladanie game progress
6. ✅ Ticket systém
7. ✅ Referral systém

## Poznámky

- Guest účty môžu byť upgradované na plný účet
- Jeden wallet môže byť len na jednom účte
- Google email sa automaticky prepojí s profilom
- Všetky začínajú s 1000 food points a 5 tickets
