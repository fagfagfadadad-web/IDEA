# 🎮 PupFi Arena Setup Guide

## Firebase Indexes Setup

The Arena game requires specific Firebase Firestore indexes to function properly. Follow these steps:

### Option 1: Automatic Setup (Recommended)

1. **Navigate to Firebase Console:**
   - Go to https://console.firebase.google.com
   - Select your project: `zend-45ae2`

2. **Click the Error Link:**
   When you try to load the arena lobby, Firebase will show an error with a direct link to create the index.
   Click that link and it will auto-create the index for you.

3. **Wait for Index to Build:**
   - Indexes can take 2-10 minutes to build
   - You'll see status change from "Building" to "Enabled"

### Option 2: Manual Setup

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Add Index"
3. Create the following indexes:

#### Index 1: Arena Matches (Basic)
```
Collection: arena_matches
Fields:
  - status (Ascending)
  - createdAt (Descending)
  - __name__ (Ascending)
```

#### Index 2: Arena Matches (With Mode Filter)
```
Collection: arena_matches
Fields:
  - mode (Ascending)
  - status (Ascending)
  - createdAt (Descending)
  - __name__ (Ascending)
```

#### Index 3: Arena Matches (Status with Mode)
```
Collection: arena_matches
Fields:
  - status (Ascending)
  - mode (Ascending)
  - createdAt (Descending)
```

### Option 3: Firebase CLI

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:indexes
```

The `firestore.indexes.json` file already contains the required indexes.

---

## Firebase Collections Structure

The Arena game uses these Firestore collections:

### 1. `arena_matches`
Stores active and completed matches.

**Fields:**
- `matchId` (string) - Unique match identifier
- `mode` (string) - Game mode (ffa, team, survival, battle_royale)
- `map` (string) - Selected map
- `status` (string) - Match status (waiting, starting, in_progress, finished)
- `players` (array) - Array of player objects
- `maxPlayers` (number) - Maximum players allowed
- `hostId` (string) - User ID of match host
- `startTime` (number) - Match start timestamp
- `endTime` (number) - Match end timestamp
- `duration` (number) - Match duration in seconds
- `winnerId` (string) - Winner user ID (for FFA)
- `winnerTeam` (string) - Winner team (A or B)
- `createdAt` (number) - Creation timestamp
- `updatedAt` (number) - Last update timestamp

### 2. `arena_player_stats`
Stores persistent player statistics.

**Fields:**
- `userId` (string) - User ID (document ID)
- `username` (string) - Player username
- `level` (number) - Player level
- `xp` (number) - Total XP earned
- `rank` (string) - Rank (Bronze, Silver, Gold, etc.)
- `mmr` (number) - Matchmaking rating
- `totalMatches` (number) - Total matches played
- `wins` (number) - Total wins
- `losses` (number) - Total losses
- `totalKills` (number) - Total kills
- `totalDeaths` (number) - Total deaths
- `totalDamage` (number) - Total damage dealt
- `totalPlaytime` (number) - Total time played (ms)
- `favoriteCharacter` (string) - Most played character
- `favoriteWeapon` (string) - Most used weapon
- `highestKillStreak` (number) - Best kill streak
- `pupfiEarned` (number) - Total PUPFI earned from arena
- `unlockedCharacters` (array) - Unlocked characters
- `unlockedWeapons` (array) - Unlocked weapons
- `unlockedSkins` (array) - Unlocked cosmetic skins
- `lastPlayed` (number) - Last play timestamp
- `createdAt` (number) - Account creation timestamp

### 3. `arena_match_results`
Stores detailed match results for history.

**Fields:**
- `matchId` (string) - Reference to match
- `mode` (string) - Game mode
- `map` (string) - Map played
- `duration` (number) - Match duration
- `playerStats` (array) - Array of player performance stats
- `winnerId` (string) - Winner user ID
- `winnerTeam` (string) - Winner team
- `timestamp` (number) - Match end timestamp

### 4. `arena_daily_missions`
Stores daily mission progress.

**Fields:**
- `missionId` (string) - Mission ID
- `userId` (string) - User ID
- `description` (string) - Mission description
- `requirement` (number) - Required count to complete
- `progress` (number) - Current progress
- `reward` (number) - PUPFI reward amount
- `completed` (boolean) - Completion status
- `date` (string) - Date (YYYY-MM-DD)

### 5. `arena_leaderboard`
Stores leaderboard rankings.

**Fields:**
- `userId` (string) - User ID
- `username` (string) - Player username
- `rank` (number) - Leaderboard position
- `mmr` (number) - MMR score
- `wins` (number) - Total wins
- `kills` (number) - Total kills
- `kd` (number) - Kill/Death ratio
- `season` (string) - Season identifier

### 6. `arena_game_events`
Stores in-game events for replay/analysis.

**Fields:**
- `eventId` (string) - Event ID
- `matchId` (string) - Match reference
- `type` (string) - Event type (kill, death, powerup, etc.)
- `playerId` (string) - Player who triggered event
- `targetId` (string) - Target player (for kills)
- `data` (object) - Additional event data
- `timestamp` (number) - Event timestamp

---

## Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Arena Collections
match /arena_matches/{matchId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null
    && (resource.data.hostId == request.auth.uid
        || resource.data.players[request.auth.uid] != null);
  allow delete: if request.auth != null && resource.data.hostId == request.auth.uid;
}

match /arena_player_stats/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}

match /arena_match_results/{resultId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
}

match /arena_daily_missions/{missionId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow write: if request.auth != null && request.auth.uid == resource.data.userId;
}

match /arena_leaderboard/{entry} {
  allow read: if true;
  allow write: if false;
}

match /arena_game_events/{eventId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
}
```

---

## Testing the Arena

### 1. Create a Match
1. Navigate to `/arena` in your app
2. Select game mode, map, and character
3. Click "Create Match"

### 2. Join a Match
1. Open the app in another browser/incognito window
2. Login with different account
3. Navigate to `/arena`
4. You should see the match in "Active Matches"
5. Click "Join Match"

### 3. Start the Game
- Host can start the match when 2+ players are ready
- Countdown begins (3...2...1)
- Game starts (Phaser.js integration coming soon)

---

## Troubleshooting

### Error: "The query requires an index"
**Solution:** Click the link in the error message to auto-create the index, or create it manually in Firebase Console.

### Error: "Match not found"
**Solution:** The match may have expired or been deleted. Create a new match.

### Error: "Match is full"
**Solution:** The match reached max players (8). Join a different match or create your own.

### Players not appearing in match
**Solution:** Check Firebase real-time listeners are working. Refresh the page.

### Can't create match
**Solution:** Ensure you're logged in and Firebase auth is working properly.

---

## Next Steps

The current implementation includes:
- ✅ Match creation and joining
- ✅ Real-time player sync
- ✅ Character selection
- ✅ Match lobby
- ✅ Stats tracking
- ✅ Daily missions
- ✅ PUPFI rewards

Coming soon:
- ⏳ Full Phaser.js game engine integration
- ⏳ Weapon system
- ⏳ Power-ups
- ⏳ Combat mechanics
- ⏳ Map visuals
- ⏳ Sound effects

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase indexes are enabled
3. Ensure you're logged in
4. Try refreshing the page

For development help, check the codebase:
- `/src/services/arenaService.ts` - Backend logic
- `/src/pages/Arena/` - UI components
- `/src/types/arena.types.ts` - Type definitions
