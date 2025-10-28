# 🎮 Arena Quick Start - Firebase Index Setup

## ⚠️ IMPORTANT: First Time Setup Required

When you first visit the Arena (`/arena`), you'll see this error:

```
Error loading matches: The query requires an index.
```

**This is normal!** Follow these 3 easy steps:

---

## 📝 Setup Steps (5 minutes)

### Step 1: Click the Firebase Link

The error message will show a link like:
```
https://console.firebase.google.com/v1/r/project/zend-45ae2/firestore/indexes?create_composite=...
```

**Click this link** - it will open Firebase Console with the exact index pre-configured.

### Step 2: Create the Index

1. You'll be logged into Firebase Console
2. Click the blue **"Create Index"** button
3. Wait for the index to build (2-5 minutes)
4. Status will change from "Building" → "Enabled"

### Step 3: Refresh Your App

Once the index status shows **"Enabled"**:
1. Go back to your PupFi Arena tab
2. Refresh the page (F5 or Cmd+R)
3. Arena lobby should now load! 🎉

---

## 🎮 How to Play

### Create a Match
1. Go to Game Center → Click **"PupFi Arena"**
2. Select:
   - **Game Mode** (Free For All, Team Battle, etc.)
   - **Map** (Classic Arena, Space Station, etc.)
   - **Character** (Scout, Tank, Blaster, etc.)
3. Click **"Create Match"**

### Join a Match
1. See active matches in the lobby
2. Click **"Join Match"** on any available game
3. Wait for other players
4. Host will start the match when ready

### Quick Play
Click **"Quick Play"** to auto-join or create a match instantly!

---

## 🏆 Rewards

- **Kill:** +10 PUPFI
- **Win Match:** +150 PUPFI (FFA) or +100 PUPFI (Team)
- **Lose Match:** +50 PUPFI
- **Daily Missions:** Up to +300 PUPFI per day

---

## ❓ Troubleshooting

**"Match is full"**
→ The match reached 8 players. Join another match.

**"Match already started"**
→ Can't join matches in progress. Create a new one.

**Still seeing index error after 5+ minutes**
→ Clear browser cache and refresh, or create index manually (see ARENA_SETUP.md)

**Players not appearing**
→ Refresh the page. Firebase real-time sync takes 1-2 seconds.

---

## 🚀 What's Working Now

✅ Match creation and joining
✅ Real-time player sync
✅ 8 character classes
✅ 12 maps (visual coming soon)
✅ 5 game modes
✅ Stats tracking
✅ PUPFI rewards
✅ Daily missions

## ⏳ Coming Soon

🔜 Full Phaser.js game with combat
🔜 Weapon system (12 weapons)
🔜 Power-ups (15 types)
🔜 Map visuals
🔜 Sound effects

---

**Have fun in the Arena!** 🎮⚔️
