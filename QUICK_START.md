# PupFi Multi-Auth - Quick Start

## 🎮 3 spôsoby ako začať hrať

### Option 1: Play as Guest (Najrýchlejšie)
1. Otvor aplikáciu
2. Klikni **"Play as Guest"**
3. Začni hrať okamžite!

### Option 2: Sign in with Google
1. Otvor aplikáciu
2. Klikni **"Continue with Google"**
3. Vyber Google účet
4. Progress sa uloží natrvalo

### Option 3: Connect Wallet
1. Otvor aplikáciu  
2. Klikni **"Connect MultiversX Wallet"**
3. Pripoj xPortal alebo inú peňaženku
4. Prístup k blockchain funkciám

## ⚙️ Nastavenie pre vývojárov

### 1. Povoliť Firebase Authentication

V [Firebase Console](https://console.firebase.google.com):

**Anonymous Auth:**
- Authentication → Sign-in method
- Enable "Anonymous"
- Save

**Google Auth:**
- Authentication → Sign-in method  
- Enable "Google"
- Zadaj support email
- Save

### 2. Spusti aplikáciu

```bash
npm install
npm run dev
```

Hotovo! Všetky 3 možnosti prihlásenia sú funkčné.

## 📊 Čo sa stane pri prihlásení

Pri každom prihlásení (Guest/Google/Wallet):
- ✅ Vytvorí sa profil v Firestore
- ✅ Dostaneš 1000 PupFi tokens
- ✅ Dostaneš 5 game tickets
- ✅ Vytvorí sa starter dog

## 🔄 Upgrade Anonymous → Google

Ak začneš ako Guest a chceš uložiť progress:

1. Choď na Profile stránku
2. Klikni "Upgrade to Google"
3. Prihlás sa cez Google
4. Všetok progress zostane zachovaný!

## 🔗 Prepojenie MultiversX Wallet

Ak máš Google účet a chceš blockchain features:

1. Choď na Profile stránku
2. Klikni "Link Wallet"
3. Pripoj MultiversX peňaženku
4. Teraz máš prístup k obom!

## 📝 Technical Details

Celá dokumentácia: `FIREBASE_MULTI_AUTH.md`

Firebase služba: `src/services/firebaseAuthService.ts`

Komponenty:
- Login: `src/pages/Unlock/Unlock.tsx`
- Profile: `src/pages/Profile/Profile.tsx`
