# 🛠️ Arena Console Helpers

Quick commands you can run in browser DevTools console for debugging and testing.

---

## 🗑️ Delete All Arena Matches

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');

  const snapshot = await getDocs(collection(db, 'arena_matches'));
  console.log(`Found ${snapshot.size} matches to delete...`);

  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'arena_matches', docSnap.id));
    console.log(`✅ Deleted match: ${docSnap.id}`);
  }

  console.log('✅ All matches deleted!');
})();
```

---

## 🔧 Fix All Existing Matches

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');

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

  const snapshot = await getDocs(collection(db, 'arena_matches'));
  console.log(`Found ${snapshot.size} matches to fix...`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.players && Array.isArray(data.players)) {
      const cleanedPlayers = data.players.map(cleanPlayerData);
      await updateDoc(doc(db, 'arena_matches', docSnap.id), {
        players: cleanedPlayers
      });
      console.log(`✅ Fixed match: ${docSnap.id}`);
    }
  }

  console.log('✅ All matches fixed!');
})();
```

---

## 📊 List All Active Matches

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { collection, getDocs } = await import('firebase/firestore');

  const snapshot = await getDocs(collection(db, 'arena_matches'));

  console.table(snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      mode: data.mode,
      status: data.status,
      players: data.players?.length || 0,
      maxPlayers: data.maxPlayers,
      map: data.map,
    };
  }));
})();
```

---

## 🎮 Create Test Match

```javascript
(async () => {
  const { ArenaService } = await import('./src/services/arenaService');
  const { GameMode, MapType, CharacterClass } = await import('./src/types/arena.types');

  const userId = 'test-user-123';
  const matchId = await ArenaService.createMatch(
    userId,
    GameMode.FREE_FOR_ALL,
    MapType.CLASSIC_ARENA,
    8
  );

  await ArenaService.joinMatch(
    matchId,
    userId,
    'TestPlayer',
    CharacterClass.SCOUT
  );

  console.log(`✅ Test match created: ${matchId}`);
})();
```

---

## 👤 View My Arena Stats

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { doc, getDoc } = await import('firebase/firestore');
  const { auth } = await import('./src/lib/firebase');

  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ Not logged in!');
    return;
  }

  const statsDoc = await getDoc(doc(db, 'arena_player_stats', userId));

  if (statsDoc.exists()) {
    console.log('📊 Your Arena Stats:');
    console.table(statsDoc.data());
  } else {
    console.log('No stats found. Play a match first!');
  }
})();
```

---

## 🏆 View Leaderboard

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');

  const q = query(
    collection(db, 'arena_player_stats'),
    orderBy('wins', 'desc'),
    limit(10)
  );

  const snapshot = await getDocs(q);

  console.table(snapshot.docs.map((doc, i) => {
    const data = doc.data();
    return {
      rank: i + 1,
      username: data.username,
      wins: data.wins,
      kills: data.totalKills,
      kd: (data.totalKills / Math.max(data.totalDeaths, 1)).toFixed(2),
      level: data.level,
    };
  }));
})();
```

---

## 🔥 Delete My Arena Stats (Reset)

```javascript
(async () => {
  const { db } = await import('./src/lib/firebase');
  const { doc, deleteDoc } = await import('firebase/firestore');
  const { auth } = await import('./src/lib/firebase');

  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ Not logged in!');
    return;
  }

  await deleteDoc(doc(db, 'arena_player_stats', userId));
  console.log('✅ Arena stats reset!');
})();
```

---

## 🧪 Simulate Match Result

```javascript
(async () => {
  const { ArenaService } = await import('./src/services/arenaService');
  const { auth } = await import('./src/lib/firebase');

  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('❌ Not logged in!');
    return;
  }

  // This would normally be called by the game engine
  // For testing, you can manually trigger stats update

  console.log('Simulating match result...');
  console.log('Note: You need to create a real match first!');
})();
```

---

## 📝 Check Firebase Indexes Status

```javascript
console.log('Go to: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes');
console.log('Check if "arena_matches" indexes are enabled (green checkmark)');
```

---

## Usage

1. Open your app in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Copy-paste any command above
5. Press Enter

**Note:** These commands only work when you're on the app page, not on this markdown file!
