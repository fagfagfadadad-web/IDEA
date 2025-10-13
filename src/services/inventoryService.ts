import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface InventoryItem {
  id?: string;
  userId: string;
  itemId: string;
  itemName: string;
  itemType: 'consumable' | 'boost' | 'special';
  quantity: number;
  purchasedAt: any;
  usedAt?: any;
  isUsed: boolean;
  effect: any;
  metadata: any;
  createdAt: any;
}

export interface DailyDeal {
  id?: string;
  itemId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  availableUntil: any;
  isActive: boolean;
  createdAt: any;
}

export interface RareItem {
  id?: string;
  itemId: string;
  name: string;
  description: string;
  price: number;
  rarity: 'rare' | 'epic' | 'legendary';
  effect: any;
  emoji: string;
  availableFrom: any;
  availableUntil?: any;
  isActive: boolean;
  createdAt: any;
}

export const InventoryService = {
  async getUserInventory(userId: string): Promise<InventoryItem[]> {
    try {
      const q = query(
        collection(db, 'inventoryItems'),
        where('userId', '==', userId),
        where('isUsed', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  },

  async addItemToInventory(
    userId: string,
    itemId: string,
    itemName: string,
    itemType: string,
    effect: any,
    metadata?: any
  ): Promise<InventoryItem> {
    const existingQuery = query(
      collection(db, 'inventoryItems'),
      where('userId', '==', userId),
      where('itemId', '==', itemId),
      where('isUsed', '==', false)
    );

    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty && itemType === 'consumable') {
      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data();
      await updateDoc(doc(db, 'inventoryItems', existingDoc.id), {
        quantity: existingData.quantity + 1
      });
      return { id: existingDoc.id, ...existingData, quantity: existingData.quantity + 1 } as InventoryItem;
    }

    const docRef = await addDoc(collection(db, 'inventoryItems'), {
      userId,
      itemId,
      itemName,
      itemType,
      quantity: 1,
      effect,
      metadata: metadata || {},
      isUsed: false,
      purchasedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as InventoryItem;
  },

  async useInventoryItem(itemId: string, userId: string): Promise<void> {
    const itemRef = doc(db, 'inventoryItems', itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      throw new Error('Item not found');
    }

    const item = itemSnap.data();
    if (item.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (item.quantity > 1) {
      await updateDoc(itemRef, {
        quantity: item.quantity - 1
      });
    } else {
      await updateDoc(itemRef, {
        isUsed: true,
        usedAt: serverTimestamp(),
        quantity: 0
      });
    }
  },

  async deleteInventoryItem(itemId: string, userId: string): Promise<void> {
    const itemRef = doc(db, 'inventoryItems', itemId);
    const itemSnap = await getDoc(itemRef);

    if (!itemSnap.exists()) {
      throw new Error('Item not found');
    }

    const item = itemSnap.data();
    if (item.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await deleteDoc(itemRef);
  },

  async getDailyDeals(): Promise<DailyDeal[]> {
    try {
      const q = query(
        collection(db, 'dailyDeals'),
        where('isActive', '==', true),
        orderBy('discountPercentage', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const now = new Date();

      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as DailyDeal)
        .filter(deal => {
          const availableUntil = deal.availableUntil?.toDate?.() || new Date(deal.availableUntil);
          return availableUntil > now;
        });
    } catch (error) {
      console.error('Error getting daily deals:', error);
      return [];
    }
  },

  async createDailyDeal(
    itemId: string,
    originalPrice: number,
    discountPercentage: number,
    hoursAvailable: number = 24
  ): Promise<DailyDeal> {
    const availableUntil = new Date();
    availableUntil.setHours(availableUntil.getHours() + hoursAvailable);

    const discountedPrice = Math.floor(originalPrice * (1 - discountPercentage / 100));

    const docRef = await addDoc(collection(db, 'dailyDeals'), {
      itemId,
      originalPrice,
      discountedPrice,
      discountPercentage,
      availableUntil,
      isActive: true,
      createdAt: serverTimestamp()
    });

    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as DailyDeal;
  },

  async getRareItems(): Promise<RareItem[]> {
    try {
      const q = query(
        collection(db, 'rareItems'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RareItem[];
    } catch (error) {
      console.error('Error getting rare items:', error);
      return [];
    }
  },

  async purchaseRareItem(
    userId: string,
    rareItem: RareItem
  ): Promise<InventoryItem> {
    return await this.addItemToInventory(
      userId,
      rareItem.itemId,
      rareItem.name,
      'special',
      rareItem.effect,
      { rarity: rareItem.rarity, emoji: rareItem.emoji }
    );
  }
};
