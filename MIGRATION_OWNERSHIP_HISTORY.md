# Migration Guide: Add Usernames to Ownership History

## Problem
Existing `petOwnershipHistory` records in Firebase only have `fromUserId` and `toUserId`, but are missing `fromUsername` and `toUsername` fields. This causes "Unknown" to display in the sales history.

## Solution
New records created after this update will automatically include usernames. For existing records, you have two options:

### Option 1: Wait for New Transactions
- New purchases will automatically populate with usernames
- Old records will continue showing "Unknown"
- Simple, no action needed

### Option 2: Manual Migration (Firebase Console)
For each record in `petOwnershipHistory` collection:

1. Open Firebase Console → Firestore Database
2. Navigate to `petOwnershipHistory` collection
3. For each document:
   - Find the `fromUserId` field
   - Look up that user in the `users` collection
   - Copy their `username`
   - Add field `fromUsername` with that username value
   - Repeat for `toUserId` → `toUsername`

### Option 3: Bulk Migration Script (Advanced)
If you have many records, you can use Firebase Admin SDK:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migrateOwnershipHistory() {
  const historyRef = db.collection('petOwnershipHistory');
  const snapshot = await historyRef.get();

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip if already has usernames
    if (data.fromUsername && data.toUsername) continue;

    // Get usernames
    const fromUsername = data.fromUserId === 'system'
      ? 'System'
      : await getUserUsername(data.fromUserId);
    const toUsername = await getUserUsername(data.toUserId);

    batch.update(doc.ref, {
      fromUsername,
      toUsername
    });

    count++;

    // Commit in batches of 500
    if (count === 500) {
      await batch.commit();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log('Migration complete!');
}

async function getUserUsername(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  return userDoc.exists ? userDoc.data().username : 'Unknown';
}

migrateOwnershipHistory();
```

## What Changed in Code
- **`adoptPet()`**: Now saves `fromUsername: 'System'` and `toUsername: <user's name>`
- **`purchasePet()`**: Now saves both `fromUsername` and `toUsername` from buyer and seller
- **Display**: Sales history now shows actual usernames instead of "Unknown"
