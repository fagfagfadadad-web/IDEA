import { supabase } from '../lib/supabase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MarketplaceListing {
  id: string;
  user_id: string;
  inventory_item_id?: string;
  item_id: string;
  item_name: string;
  item_type: 'consumable' | 'boost' | 'special';
  quantity: number;
  price: number;
  effect: any;
  metadata: any;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MarketplaceTransaction {
  id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  transaction_fee: number;
  seller_earnings: number;
  created_at: string;
}

const MARKETPLACE_FEE_PERCENTAGE = 0.10;

export const MarketplaceService = {
  async getActiveListings(): Promise<MarketplaceListing[]> {
    if (!supabase) {
      console.warn('Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserListings(userId: string): Promise<MarketplaceListing[]> {
    if (!supabase) {
      console.warn('Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'sold'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: inventoryItem } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .eq('user_id', userId)
      .eq('is_used', false)
      .maybeSingle();

    if (!inventoryItem) {
      throw new Error('Item not found in inventory');
    }

    if (inventoryItem.quantity < quantity) {
      throw new Error('Insufficient quantity');
    }

    if (inventoryItem.quantity === quantity) {
      await supabase
        .from('inventory_items')
        .update({ is_used: true })
        .eq('id', inventoryItemId);
    } else {
      await supabase
        .from('inventory_items')
        .update({ quantity: inventoryItem.quantity - quantity })
        .eq('id', inventoryItemId);
    }

    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert({
        user_id: userId,
        inventory_item_id: inventoryItemId,
        item_id: itemId,
        item_name: itemName,
        item_type: itemType,
        quantity,
        price,
        effect,
        metadata,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async purchaseListing(
    listingId: string,
    buyerId: string
  ): Promise<{ transaction: MarketplaceTransaction; item: any }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .maybeSingle();

    if (!listing) {
      throw new Error('Listing not found or already sold');
    }

    if (listing.user_id === buyerId) {
      throw new Error('Cannot buy your own listing');
    }

    const buyerRef = doc(db, 'gameStats', buyerId);
    const { getDoc } = await import('firebase/firestore');
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

    await updateDoc(buyerRef, {
      zenBalance: increment(-listing.price),
      updatedAt: serverTimestamp()
    });

    const sellerRef = doc(db, 'gameStats', listing.user_id);
    await updateDoc(sellerRef, {
      zenBalance: increment(sellerEarnings),
      updatedAt: serverTimestamp()
    });

    await supabase
      .from('marketplace_listings')
      .update({ status: 'sold' })
      .eq('id', listingId);

    const { data: transaction } = await supabase
      .from('marketplace_transactions')
      .insert({
        listing_id: listingId,
        seller_id: listing.user_id,
        buyer_id: buyerId,
        item_id: listing.item_id,
        item_name: listing.item_name,
        quantity: listing.quantity,
        price: listing.price,
        transaction_fee: transactionFee,
        seller_earnings: sellerEarnings
      })
      .select()
      .single();

    const { data: newInventoryItem } = await supabase
      .from('inventory_items')
      .insert({
        user_id: buyerId,
        item_id: listing.item_id,
        item_name: listing.item_name,
        item_type: listing.item_type,
        quantity: listing.quantity,
        effect: listing.effect,
        metadata: { ...listing.metadata, source: 'marketplace' }
      })
      .select()
      .single();

    return { transaction: transaction!, item: newInventoryItem };
  },

  async cancelListing(listingId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!listing) {
      throw new Error('Listing not found');
    }

    await supabase
      .from('marketplace_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId);

    if (listing.inventory_item_id) {
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', listing.inventory_item_id)
        .maybeSingle();

      if (inventoryItem) {
        if (inventoryItem.is_used) {
          await supabase
            .from('inventory_items')
            .update({
              is_used: false,
              quantity: listing.quantity
            })
            .eq('id', listing.inventory_item_id);
        } else {
          await supabase
            .from('inventory_items')
            .update({
              quantity: inventoryItem.quantity + listing.quantity
            })
            .eq('id', listing.inventory_item_id);
        }
      }
    }
  },

  async getUserTransactions(userId: string): Promise<MarketplaceTransaction[]> {
    if (!supabase) {
      console.warn('Supabase not configured');
      return [];
    }

    const { data, error } = await supabase
      .from('marketplace_transactions')
      .select('*')
      .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
