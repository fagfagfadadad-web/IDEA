# Povoliť Firebase Authentication

Aby fungovalo **Guest prihlásenie** a **Google prihlásenie**, musíš povoliť tieto metódy v Firebase Console.

## 🔧 Kroky

### 1. Otvor Firebase Console

Choď na: https://console.firebase.google.com/project/zend-45ae2

(Alebo si vyber svoj projekt ak máš iný)

### 2. Prejdi na Authentication

V ľavom menu:
- Klikni na **Authentication**
- Potom klikni na **Sign-in method** tab

### 3. Povoliť Anonymous Authentication

1. V zozname poskytovateľov nájdi **Anonymous**
2. Klikni na **Anonymous** riadok
3. Prepni prepínač na **Enabled**
4. Klikni **Save**

### 4. Povoliť Google Authentication

1. V zozname poskytovateľov nájdi **Google**
2. Klikni na **Google** riadok
3. Prepni prepínač na **Enabled**
4. Zadaj **Project support email** (tvoj email)
5. Klikni **Save**

## ✅ Hotovo!

Teraz máš povolené:
- ✅ Anonymous (Guest) prihlásenie
- ✅ Google OAuth prihlásenie
- ✅ MultiversX Wallet (už funguje)

## 🧪 Testovanie

1. Spusti aplikáciu: `npm run dev`
2. Otvor http://localhost:3000
3. Mal by si vidieť **3 tlačidlá**:
   - 🎮 Play as Guest
   - 🔐 Continue with Google
   - 💎 Connect MultiversX Wallet

Klikni na ktorékoľvek a skús sa prihlásiť!

## 🐛 Troubleshooting

### "This operation is not allowed"

Firebase authentication nie je povolená. Vráť sa na kroky 3 a 4.

### "Network error"

Skontroluj Firebase config v `.env` súbore:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### Google popup sa neotvorí

1. Skontroluj či máš povolené popups v prehliadači
2. Skús použiť incognito mode
3. Skontroluj Firebase Google Auth nastavenia

### Anonymous prihlásenie nefunguje

Uisti sa že máš povolenú **Anonymous** metódu v Firebase Console.

## 📝 Poznámky

- **Anonymous users** majú `isAnonymous = true` flag
- Môžeš neskôr **upgradovať** anonymous na Google
- **Firebase Emulator** nie je potrebný - používa production
- Všetko je **free** na Firebase Spark (free) pláne

## 🔐 Bezpečnosť

Firebase Authentication je:
- ✅ **Bezpečné** - Industry standard
- ✅ **Škálovateľné** - Milióny používateľov
- ✅ **Jednoduché** - Žiadny backend kód potrebný
- ✅ **Free** - Až 10,000 monthly active users zdarma

## 🚀 Production Deployment

Pred deploymentom na production:

1. ✅ Skontroluj že Anonymous a Google sú povolené
2. ✅ Pridaj authorized domains v Firebase Console
   - Authentication → Settings → Authorized domains
   - Pridaj svoju production doménu (napr. `pupfi.app`)
3. ✅ Otestuj všetky 3 auth flow na production URL

## 📚 Ďalšie zdroje

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Anonymous Auth Guide](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Google Sign-In Guide](https://firebase.google.com/docs/auth/web/google-signin)
