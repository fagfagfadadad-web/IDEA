import { supabase } from '../lib/supabase';

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  item_type: 'consumable' | 'boost' | 'special';
  quantity: number;
  purchased_at: string;
  used_at?: string;
  is_used: boolean;
  effect: any;
  metadata: any;
  created_at: string;
}

export interface DailyDeal {
  id: string;
  item_id: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  available_until: string;
  is_active: boolean;
  created_at: string;
}

export interface RareItem {
  id: string;
  item_id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'rare' | 'epic' | 'legendary';
  effect: any;
  emoji: string;
  available_from: string;
  available_until?: string;
  is_active: boolean;
  created_at: string;
}

export const InventoryService = {
  async getUserInventory(userId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_used', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addItemToInventory(
    userId: string,
    itemId: string,
    itemName: string,
    itemType: string,
    effect: any,
    metadata?: any
  ): Promise<InventoryItem> {
    const existingItem = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('is_used', false)
      .maybeSingle();

    if (existingItem.data && itemType === 'consumable') {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ quantity: existingItem.data.quantity + 1 })
        .eq('id', existingItem.data.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        user_id: userId,
        item_id: itemId,
        item_name: itemName,
        item_type: itemType,
        quantity: 1,
        effect,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async useInventoryItem(itemId: string, userId: string): Promise<void> {
    const { data: item } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!item) throw new Error('Item not found');

    if (item.quantity > 1) {
      await supabase
        .from('inventory_items')
        .update({ quantity: item.quantity - 1 })
        .eq('id', itemId);
    } else {
      await supabase
        .from('inventory_items')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          quantity: 0
        })
        .eq('id', itemId);
    }
  },

  async deleteInventoryItem(itemId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getDailyDeals(): Promise<DailyDeal[]> {
    const { data, error } = await supabase
      .from('daily_deals')
      .select('*')
      .eq('is_active', true)
      .gt('available_until', new Date().toISOString())
      .order('discount_percentage', { ascending: false });

    if (error) throw error;
    return data || [];
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

    const { data, error } = await supabase
      .from('daily_deals')
      .insert({
        item_id: itemId,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        discount_percentage: discountPercentage,
        available_until: availableUntil.toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRareItems(): Promise<RareItem[]> {
    const { data, error } = await supabase
      .from('rare_items')
      .select('*')
      .eq('is_active', true)
      .order('rarity', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async purchaseRareItem(
    userId: string,
    rareItem: RareItem
  ): Promise<InventoryItem> {
    return await this.addItemToInventory(
      userId,
      rareItem.item_id,
      rareItem.name,
      'special',
      rareItem.effect,
      { rarity: rareItem.rarity, emoji: rareItem.emoji }
    );
  }
};
