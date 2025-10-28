# 🔧 Fix Existing Arena Matches

## Problem

If you see this error:
```
Function updateDoc() called with invalid data. Unsupported field value: undefined
(found in document arena_matches/...)
```

This means there are existing matches in Firestore with `undefined` values. Firebase doesn't allow `undefined` in documents.

---

## Solution 1: Delete Existing Matches (Quick Fix)

### Option A: Firebase Console
1. Go to https://console.firebase.google.com
2. Navigate to Firestore Database
3. Find collection: `arena_matches`
4. Delete all documents in this collection
5. Refresh your app

### Option B: Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste this code:

```javascript
// Delete all arena matches
const db = firebase.firestore();
const matchesRef = db.collection('arena_matches');

matchesRef.get().then(snapshot => {
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  return batch.commit();
}).then(() => {
  console.log('✅ All matches deleted! Refresh the page.');
}).catch(error => {
  console.error('Error:', error);
});
```

---

## Solution 2: Clean Existing Matches (Preserve Data)

If you want to keep existing matches but fix the undefined values:

```javascript
// Fix all existing matches
const db = firebase.firestore();
const matchesRef = db.collection('arena_matches');

function cleanPlayerData(player) {
  const cleaned = {
    userId: player.userId,
    username: player.username,
    character: player.character,
    hp: player.hp,
    maxHp: player.maxHp,
    shield: player.shield,
    kills: player.kills,
    deaths: player.deaths,
    score: player.score,
    position: player.position,
    currentWeapon: player.currentWeapon,
    activePowerUps: player.activePowerUps || [],
    isAlive: player.isAlive,
  };

  if (player.team) cleaned.team = player.team;
  if (player.secondaryWeapon) cleaned.secondaryWeapon = player.secondaryWeapon;
  if (player.respawnTime) cleaned.respawnTime = player.respawnTime;

  return cleaned;
}

matchesRef.get().then(snapshot => {
  const batch = db.batch();

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.players && Array.isArray(data.players)) {
      const cleanedPlayers = data.players.map(cleanPlayerData);
      batch.update(doc.ref, { players: cleanedPlayers });
    }
  });

  return batch.commit();
}).then(() => {
  console.log('✅ All matches fixed! Refresh the page.');
}).catch(error => {
  console.error('Error:', error);
});
```

---

## Prevention

The code has been updated to automatically clean player data before saving. This error should not appear for new matches.

**Fixed in:**
- `ArenaService.joinMatch()` - Cleans player data before adding
- `ArenaService.leaveMatch()` - Cleans all players when updating
- `ArenaService.updatePlayerState()` - Cleans players when updating state
- `ArenaService.recordKill()` - Cleans players when recording kills

---

## Testing

After applying the fix:

1. Refresh your app
2. Navigate to `/arena`
3. Try to create a match
4. You should NOT see the `undefined` error anymore

If error persists, check:
- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh (Ctrl+F5)
- Ensure Firebase indexes are built

---

## Why This Happened

Firebase Firestore does not allow `undefined` values in documents. In TypeScript/JavaScript:

```javascript
// ❌ This causes error in Firestore
const player = {
  userId: '123',
  team: undefined  // Firestore rejects this
}

// ✅ Correct approaches
const player1 = {
  userId: '123',
  // Don't include team field at all
}

const player2 = {
  userId: '123',
  ...(teamValue && { team: teamValue })  // Conditional spread
}
```

Our fix ensures only defined values are saved to Firestore.
