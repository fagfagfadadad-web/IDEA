# Firebase Indexes Setup Guide

## Required Indexes for Pet Marketplace

The pet marketplace uses Firebase queries that require composite indexes. The index definitions are already configured in `firestore.indexes.json`.

### How to Deploy Indexes

#### Option 1: Using Firebase Console (Recommended)

When you see an error like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Simply click the link in the error message and Firebase will automatically create the index for you.

#### Option 2: Using Firebase CLI

If you have Firebase CLI authentication set up:

```bash
firebase deploy --only firestore:indexes --project zend-45ae2
```

### Required Indexes

The following indexes are configured in `firestore.indexes.json`:

1. **petOwnershipHistory**
   - Fields: `petId` (ASC), `transferredAt` (DESC), `__name__` (DESC)
   - Used for: Pet ownership transfer history

2. **marketListings**
   - Fields: `breedType` (ASC), `status` (ASC), `price` (ASC), `__name__` (ASC)
   - Used for: Finding floor prices and filtering marketplace listings

### Fallback Behavior

The application includes fallback logic that works even when indexes are not ready:
- Queries without orderBy when index is missing
- In-memory sorting as a temporary solution
- Console warnings: "Using fallback query for ... (index not ready)"

### Index Build Time

After creating indexes via the Firebase Console:
- Small databases: 1-5 minutes
- Medium databases: 5-30 minutes
- Large databases: Can take several hours

You can check index status in the Firebase Console under:
**Firestore Database → Indexes**
