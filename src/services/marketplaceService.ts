import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MarketplaceListing {
  id?: string;
  userId: string;
  inventoryItemId?: string;
  itemId: string;
  itemName: string;
  itemType: 'consumable' | 'boost' | 'special';
  quantity: number;
  price: number;
  effect: any;
  metadata: any;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}

export interface MarketplaceTransaction {
  id?: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  transactionFee: number;
  sellerEarnings: number;
  createdAt: any;
}

const MARKETPLACE_FEE_PERCENTAGE = 0.10;

export const MarketplaceService = {
  async getActiveListings(): Promise<MarketplaceListing[]> {
    try {
      const q = query(
        collection(db, 'marketplaceListings'),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MarketplaceListing[];

      return listings.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Error getting marketplace listings:', error);
      return [];
    }
  },

  async getUserListings(userId: string): Promise<MarketplaceListing[]> {
    try {
      const q = query(
        collection(db, 'marketplaceListings'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as MarketplaceListing)
        .filter(listing => listing.status === 'active' || listing.status === 'sold');

      return listings.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Error getting user listings:', error);
      return [];
    }
  },

  async createListing(
    userId: string,
    inventoryItemId: string,
    itemId: string,
    itemName: string,
    itemType: string,
    quantity: number,
    price: number,
    effect: any,
    metadata: any
  ): Promise<MarketplaceListing> {
    const inventoryRef = doc(db, 'inventoryItems', inventoryItemId);
    const inventorySnap = await getDoc(inventoryRef);

    if (!inventorySnap.exists()) {
      throw new Error('Item not found in inventory');
    }

    const inventoryItem = inventorySnap.data();
    if (inventoryItem.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (inventoryItem.quantity < quantity) {
      throw new Error('Insufficient quantity');
    }

    if (inventoryItem.quantity === quantity) {
      await updateDoc(inventoryRef, {
        isUsed: true
      });
    } else {
      await updateDoc(inventoryRef, {
        quantity: inventoryItem.quantity - quantity
      });
    }

    const docRef = await addDoc(collection(db, 'marketplaceListings'), {
      userId,
      inventoryItemId,
      itemId,
      itemName,
      itemType,
      quantity,
      price,
      effect,
      metadata,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as MarketplaceListing;
  },

  async purchaseListing(
    listingId: string,
    buyerId: string
  ): Promise<{ transaction: MarketplaceTransaction; item: any }> {
    const listingRef = doc(db, 'marketplaceListings', listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      throw new Error('Listing not found');
    }

    const listing = listingSnap.data() as MarketplaceListing;

    if (listing.status !== 'active') {
      throw new Error('Listing is not active');
    }

    if (listing.userId === buyerId) {
      throw new Error('Cannot buy your own listing');
    }

    const buyerRef = doc(db, 'gameStats', buyerId);
    const buyerSnap = await getDoc(buyerRef);

    if (!buyerSnap.exists()) {
      throw new Error('Buyer not found');
    }

    const buyerStats = buyerSnap.data();
    if (buyerStats.zenBalance < listing.price) {
      throw new Error('Insufficient balance');
    }

    const transactionFee = Math.floor(listing.price * MARKETPLACE_FEE_PERCENTAGE);
    const sellerEarnings = listing.price - transactionFee;

    const batch = writeBatch(db);

    batch.update(buyerRef, {
      zenBalance: increment(-listing.price),
      updatedAt: serverTimestamp()
    });

    const sellerRef = doc(db, 'gameStats', listing.userId);
    batch.update(sellerRef, {
      zenBalance: increment(sellerEarnings),
      updatedAt: serverTimestamp()
    });

    batch.update(listingRef, {
      status: 'sold',
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    const transactionRef = await addDoc(collection(db, 'marketplaceTransactions'), {
      listingId,
      sellerId: listing.userId,
      buyerId,
      itemId: listing.itemId,
      itemName: listing.itemName,
      quantity: listing.quantity,
      price: listing.price,
      transactionFee,
      sellerEarnings,
      createdAt: serverTimestamp()
    });

    const transactionSnap = await getDoc(transactionRef);
    const transaction = { id: transactionRef.id, ...transactionSnap.data() } as MarketplaceTransaction;

    const newInventoryRef = await addDoc(collection(db, 'inventoryItems'), {
      userId: buyerId,
      itemId: listing.itemId,
      itemName: listing.itemName,
      itemType: listing.itemType,
      quantity: listing.quantity,
      effect: listing.effect,
      metadata: { ...listing.metadata, source: 'marketplace' },
      isUsed: false,
      purchasedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    const newInventorySnap = await getDoc(newInventoryRef);
    const item = { id: newInventoryRef.id, ...newInventorySnap.data() };

    return { transaction, item };
  },

  async cancelListing(listingId: string, userId: string): Promise<void> {
    const listingRef = doc(db, 'marketplaceListings', listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      throw new Error('Listing not found');
    }

    const listing = listingSnap.data() as MarketplaceListing;

    if (listing.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (listing.status !== 'active') {
      throw new Error('Listing is not active');
    }

    await updateDoc(listingRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });

    if (listing.inventoryItemId) {
      const inventoryRef = doc(db, 'inventoryItems', listing.inventoryItemId);
      const inventorySnap = await getDoc(inventoryRef);

      if (inventorySnap.exists()) {
        const inventoryItem = inventorySnap.data();

        if (inventoryItem.isUsed) {
          await updateDoc(inventoryRef, {
            isUsed: false,
            quantity: listing.quantity
          });
        } else {
          await updateDoc(inventoryRef, {
            quantity: inventoryItem.quantity + listing.quantity
          });
        }
      }
    }
  },

  async getUserTransactions(userId: string): Promise<MarketplaceTransaction[]> {
    try {
      const q = query(
        collection(db, 'marketplaceTransactions')
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as MarketplaceTransaction)
        .filter(tx => tx.sellerId === userId || tx.buyerId === userId);

      return transactions.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  }
};
