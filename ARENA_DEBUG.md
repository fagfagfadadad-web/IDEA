# 🐛 Arena Debug Guide

## Problem: Matches not showing in lobby

If you create a match but don't see it in the "Active Matches" list on another device:

### Check 1: Firebase Indexes

The query requires composite indexes. Click the link in the error message or create manually:

**Required Indexes:**

1. **Index 1: Status + CreatedAt**
   - Collection: `arena_matches`
   - Fields: `status` (Ascending), `createdAt` (Descending), `__name__` (Ascending)

2. **Index 2: Mode + Status + CreatedAt**
   - Collection: `arena_matches`
   - Fields: `mode` (Ascending), `status` (Ascending), `createdAt` (Descending), `__name__` (Ascending)

3. **Index 3: Status + Mode + CreatedAt**
   - Collection: `arena_matches`
   - Fields: `status` (Ascending), `mode` (Ascending), `createdAt` (Descending)

---

## Debug Steps

### Step 1: Check if Match Exists in Firestore

1. Go to Firebase Console: https://console.firebase.google.com
2. Navigate to Firestore Database
3. Open collection: `arena_matches`
4. Do you see your match?
   - **YES** → Go to Step 2
   - **NO** → Match creation failed, check browser console for errors

### Step 2: Check Match Status

In Firestore, check your match document:
- `status` should be `"waiting"` or `"starting"`
- `mode` should be `"team"` (for Team Battle)
- `createdAt` should be a recent timestamp

If status is `"finished"` or `"cancelled"`, the match won't show up.

### Step 3: Check Browser Console

Open DevTools (F12) on the device where matches aren't loading:

```javascript
// Run this in console to test the query manually
import { ArenaService } from './src/services/arenaService';
import { GameMode } from './src/types/arena.types';

// Test without mode filter
const allMatches = await ArenaService.getActiveMatches();
console.log('All active matches:', allMatches);

// Test with Team Battle filter
const teamMatches = await ArenaService.getActiveMatches(GameMode.TEAM_BATTLE);
console.log('Team Battle matches:', teamMatches);
```

### Step 4: Check Index Status

1. Go to Firebase Console → Firestore → Indexes
2. Check if all 3 indexes are **Enabled** (green checkmark)
3. If status is "Building", wait 2-5 minutes
4. If status is "Error", delete and recreate the index

### Step 5: Force Refresh Data

On the device where matches aren't showing:

1. Open browser DevTools (F12)
2. Go to Console
3. Run this command:

```javascript
// Force reload active matches
window.location.reload();
```

Or:

1. Close the tab completely
2. Clear browser cache (Ctrl+Shift+Del)
3. Re-open the app

---

## Common Issues

### Issue 1: "Index not ready"

**Symptom:** Error message about missing index

**Solution:**
1. Click the link in the error message
2. Firebase Console will open with index pre-configured
3. Click "Create Index"
4. Wait 2-5 minutes for index to build
5. Refresh your app

### Issue 2: Matches load but filter doesn't work

**Symptom:** All matches load when no filter is selected, but selecting "Team Battle" shows nothing

**Solution:**
The code has a fallback that filters in-memory. This should work even without the index. Check:
1. Are you filtering by the correct mode?
2. Try changing mode dropdown to "Free For All" then back to "Team Battle"

### Issue 3: Matches disappear after creation

**Symptom:** You create a match, it briefly appears, then vanishes

**Solution:**
Check if the match status changed:
1. Go to Firestore Console
2. Find your match in `arena_matches`
3. Check the `status` field
4. If it's not "waiting", something changed the status

### Issue 4: Real-time updates not working

**Symptom:** Matches don't update automatically, need manual refresh

**Solution:**
The app polls every 5 seconds. If that's not working:
1. Check browser console for errors
2. Check Firebase rules allow read access
3. Try refreshing the page

---

## Manual Testing Checklist

### Device 1 (Create Match):
- [ ] Login successful
- [ ] Navigate to Arena lobby
- [ ] Select Team Battle mode
- [ ] Select 1v1 (2 players)
- [ ] Create match
- [ ] See "Waiting for Players" screen
- [ ] Match shows 1/2 players

### Device 2 (Join Match):
- [ ] Login with different account
- [ ] Navigate to Arena lobby
- [ ] See "Active Matches" section
- [ ] See the match created by Device 1
- [ ] Click "Join Match"
- [ ] Successfully join match

### Both Devices:
- [ ] Device 1 sees Device 2 joined (real-time update)
- [ ] Device 2 sees their name in the match
- [ ] Match shows 2/2 players
- [ ] Host can click "Start Match"

---

## Firestore Rules Check

Ensure your `firestore.rules` allow reading matches:

```javascript
match /arena_matches/{matchId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null
    && (resource.data.hostId == request.auth.uid
        || resource.data.players[request.auth.uid] != null);
}
```

If rules are too restrictive, matches won't load.

---

## Quick Fix Command

If all else fails, run this in browser console to see raw data:

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { collection, getDocs, query, where } = await import('firebase/firestore');

  const q = query(
    collection(db, 'arena_matches'),
    where('status', 'in', ['waiting', 'starting'])
  );

  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.size} matches`);

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Match ${doc.id}:`, {
      mode: data.mode,
      status: data.status,
      players: data.players?.length,
      maxPlayers: data.maxPlayers,
    });
  });
})();
```

This will show you exactly what's in the database.

---

## Still Not Working?

1. **Delete all old matches:**
   - Go to Firestore Console
   - Delete all documents in `arena_matches`
   - Try creating a fresh match

2. **Check Firebase quota:**
   - Go to Firebase Console → Usage
   - Ensure you haven't hit read/write limits

3. **Try different browser:**
   - Sometimes browser cache causes issues
   - Try incognito mode or different browser

4. **Check network:**
   - Ensure both devices have stable internet
   - Try disabling VPN/proxy if using one

---

## Success Indicators

You'll know it's working when:
- ✅ Creating match redirects to match lobby
- ✅ Match shows in Active Matches list on other device
- ✅ Players can join and see each other in real-time
- ✅ Host can start match when 2+ players ready
- ✅ No errors in browser console

Good luck! 🎮
