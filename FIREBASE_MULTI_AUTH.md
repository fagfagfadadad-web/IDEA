# Firebase Multi-Auth Implementation

PupFi teraz podporuje **3 spôsoby prihlásenia** pomocou Firebase Authentication:

## 🎮 Možnosti prihlásenia

### 1. Play as Guest (Anonymný používateľ)
- Bez registrácie, začni hrať okamžite
- Firebase Anonymous Authentication
- Profil sa automaticky vytvorí
- Začínaš s 1000 PupFi tokens a 5 game tickets
- **Neskôr môžeš upgradovať na Google účet**

### 2. Continue with Google
- Prihlásenie cez Google OAuth
- Progress sa uloží natrvalo
- Synchronizácia naprieč zariadeniami
- Začínaš s 1000 PupFi tokens a 5 game tickets

### 3. Connect MultiversX Wallet
- Pripojenie blockchain peňaženky
- Prístup k on-chain funkciám
- Možnosť kombinovať s Google účtom

## 🔧 Technická implementácia

### Firebase služba: `firebaseAuthService.ts`

```typescript
import { FirebaseAuthService } from './services/firebaseAuthService';

// Guest prihlásenie
await FirebaseAuthService.signInAsGuest();

// Google prihlásenie
await FirebaseAuthService.signInWithGoogle();

// Upgrade anonymous na Google
await FirebaseAuthService.upgradeAnonymousAccount();
```

### Ako funguje Anonymous → Google upgrade

1. Používateľ začne ako hosť (anonymous)
2. Neskôr klikne "Upgrade to Google"
3. Firebase automaticky prepojí účty
4. Všetok progress zostane zachovaný

## 📊 Databázová štruktúra (Firebase)

Všetko zostáva v **Firestore** ako predtým:

- `users` collection - User profiles
- `gameStats` collection - Game statistics
- `ships` collection - User's dogs/pets
- `tasks` collection - Available tasks
- `userTasks` collection - Task progress
- `gamePlays` collection - Game play tracking

## 🎯 Výhody tohto riešenia

✅ **Žiadna nová závislost** - Používame existujúci Firebase
✅ **Jednoduchšie** - Nie je potrebné nastavovať Supabase
✅ **Hotové** - Google OAuth už nakonfigurovaný
✅ **Upgrade path** - Anonymous môže byť upgradovaný na Google
✅ **Zachovaný progress** - Všetky dáta sa zachovajú pri upgrade

## 🔐 Firebase nastavenie

Firebase Authentication už máš nakonfigurovaný! Stačí povoliť poskytovateľov:

### 1. Povoliť Anonymous Authentication

V Firebase Console:
1. Authentication → Sign-in method
2. Nájdi **Anonymous**
3. Klikni **Enable**
4. **Save**

### 2. Povoliť Google Authentication

V Firebase Console:
1. Authentication → Sign-in method
2. Nájdi **Google**
3. Klikni **Enable**
4. Zadaj **Project support email**
5. **Save**

To je všetko! Žiadne ďalšie nastavenia nie sú potrebné.

## 🚀 Používanie v aplikácii

### Login stránka (`/unlock`)

Zobrazuje 3 veľké tlačidlá:
- 🎮 **Play as Guest** (zelené)
- 🔐 **Continue with Google** (biele)
- 💎 **Connect MultiversX Wallet** (modré)

### Profile stránka

- Zobrazuje auth method (Guest / Google / Wallet)
- Možnosť upgradovať Guest → Google
- Možnosť prepojiť MultiversX wallet

## 📝 Príklady použitia

### Základný flow pre nového používateľa

```typescript
// 1. Klikne "Play as Guest"
await FirebaseAuthService.signInAsGuest();
// → Automaticky vytvorí profil, game stats, starter dog

// 2. Hrá hru, zbiera points...

// 3. Rozhodne sa uložiť progress
await FirebaseAuthService.upgradeAnonymousAccount();
// → Prepojí s Google, zachová všetok progress
```

### Flow pre returning používateľa

```typescript
// 1. Klikne "Continue with Google"
await FirebaseAuthService.signInWithGoogle();
// → Nájde existujúci profil alebo vytvorí nový
```

## 🔄 Porovnanie so Supabase riešením

| Feature | Firebase | Supabase |
|---------|----------|----------|
| Anonymous auth | ✅ Built-in | ✅ Built-in |
| Google OAuth | ✅ Built-in | ⚙️ Vyžaduje setup |
| Upgrade anonymous | ✅ Native support | ❌ Manuálne |
| Setup complexity | 🟢 2 kliky | 🟡 Komplexné |
| Existing data | ✅ Už máme | ❌ Treba migrovať |
| Cost | 🟢 Free tier dostatočný | 🟢 Free tier dostatočný |

## ✨ Kľúčové funkcie

### Automatické vytvorenie profilu

Pri prvom prihlásení (Guest alebo Google):
- ✅ User profile
- ✅ Game stats (1000 tokens, 5 tickets)
- ✅ Starter dog ("Playful Puppy")
- ✅ Unique username

### Auth state management

```typescript
// Poslúchaj zmeny auth stavu
FirebaseAuthService.onAuthStateChange((user) => {
  if (user) {
    console.log('User signed in:', user.uid);
  } else {
    console.log('User signed out');
  }
});
```

### Error handling

Všetky metódy vracajú jasné error správy:
- "User cancelled sign-in"
- "Network error"
- "No anonymous user to upgrade"

## 🎨 UI/UX

### Login stránka design

- Moderný gradient pozadie
- 3 veľké, čitateľné tlačidlá
- Loading stavy pre každú akciu
- Error správy červeným písmom
- Responsive design

### Icons

- 🎮 Guest mode
- Google logo (SVG)
- 🔐 Wallet connection

## 📱 Mobilná podpora

Všetky auth metódy fungujú na mobile:
- ✅ Google sign-in popup
- ✅ Anonymous creation
- ✅ Wallet connection via xPortal

## 🐛 Debugging

Firebase poskytuje výborné debugging tools:

```typescript
// V konzole uvidíš:
console.log('🆕 Creating new user profile for: guest user');
console.log('✅ User profile created:', userProfile);
console.log('🎮 Creating game stats...');
console.log('🐕 Creating starter dog...');
```

## 🎓 Testovanie

Otestuj všetky flow:

1. ✅ Guest → Hranie → Upgrade na Google
2. ✅ Priamy Google sign-in
3. ✅ Wallet connection
4. ✅ Sign out a sign in späť
5. ✅ Údaje zostanú zachované

## 🔮 Budúce možnosti

- Email/password authentication
- Facebook / Twitter OAuth
- Phone number authentication
- Multi-factor authentication (2FA)

## 💡 Tips

- Anonymous používateľ má `isAnonymous = true` flag
- Upgrade zachová `uid`, len pridá credentials
- Google photoURL sa použije ako avatar
- Username sa generuje z email alebo uid
