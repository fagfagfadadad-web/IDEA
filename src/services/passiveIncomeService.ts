import { doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Pet } from '../types/pet.types';
import { PetAbilityService } from './petAbilityService';

export interface PassiveIncomeReward {
  petName: string;
  breedType: string;
  foodEarned: number;
  hoursPassed: number;
  totalEarned: number;
}

export interface LevelUpReward {
  itemName: string;
  itemId: string;
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export class PassiveIncomeService {
  static async collectPassiveIncome(userId: string, pets: Pet[]): Promise<PassiveIncomeReward[]> {
    const rewards: PassiveIncomeReward[] = [];
    const now = new Date();
    let totalFoodEarned = 0;

    for (const pet of pets) {
      if (pet.evolutionStage === 'base') continue;

      const hasPassiveIncome = ['beagle', 'pomeranian', 'mystical_wolf'].includes(pet.breedType);
      if (!hasPassiveIncome) continue;

      const lastCollected = pet.lastPassiveIncomeCollectedAt?.toDate() || pet.adoptedAt.toDate();
      const hoursPassed = Math.floor((now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60));

      if (hoursPassed < 1) continue;

      let foodPerHour = 0;
      switch (pet.breedType) {
        case 'beagle':
          foodPerHour = pet.evolutionStage === 'evolved' ? 5 : 12;
          break;
        case 'pomeranian':
          foodPerHour = pet.evolutionStage === 'evolved' ? 4 : 12;
          break;
        case 'mystical_wolf':
          foodPerHour = pet.evolutionStage === 'evolved' ? 6 : 18;
          break;
      }

      const maxHours = 24;
      const cappedHours = Math.min(hoursPassed, maxHours);
      const foodEarned = foodPerHour * cappedHours;
      totalFoodEarned += foodEarned;

      rewards.push({
        petName: pet.name,
        breedType: pet.breedType,
        foodEarned,
        hoursPassed: cappedHours,
        totalEarned: (pet.totalPassiveIncomeEarned || 0) + foodEarned
      });

      if (pet.id) {
        const petRef = doc(db, 'pets', pet.id);
        await updateDoc(petRef, {
          lastPassiveIncomeCollectedAt: serverTimestamp(),
          totalPassiveIncomeEarned: increment(foodEarned)
        });
      }
    }

    if (totalFoodEarned > 0) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        food: increment(totalFoodEarned),
        updatedAt: serverTimestamp()
      });
    }

    return rewards;
  }

  static async checkAndCollectPassiveIncome(userId: string, pets: Pet[]): Promise<PassiveIncomeReward[]> {
    return this.collectPassiveIncome(userId, pets);
  }

  static getLevelUpRewards(level: number): LevelUpReward[] {
    const rewards: LevelUpReward[] = [];

    if (level === 5) {
      rewards.push({
        itemName: 'Basic Training Manual',
        itemId: 'training_manual_basic',
        quantity: 1,
        rarity: 'common'
      });
    }

    if (level === 10) {
      rewards.push({
        itemName: 'Energy Booster',
        itemId: 'energy_booster',
        quantity: 3,
        rarity: 'common'
      });
      rewards.push({
        itemName: 'Food Pack',
        itemId: 'food_pack_medium',
        quantity: 50,
        rarity: 'common'
      });
    }

    if (level === 15) {
      rewards.push({
        itemName: 'Advanced Training Manual',
        itemId: 'training_manual_advanced',
        quantity: 1,
        rarity: 'rare'
      });
    }

    if (level === 20) {
      rewards.push({
        itemName: 'Evolution Stone',
        itemId: 'evolution_stone',
        quantity: 1,
        rarity: 'epic'
      });
      rewards.push({
        itemName: 'Large Food Pack',
        itemId: 'food_pack_large',
        quantity: 100,
        rarity: 'rare'
      });
    }

    if (level === 25) {
      rewards.push({
        itemName: 'Shiny Charm',
        itemId: 'shiny_charm',
        quantity: 1,
        rarity: 'epic'
      });
    }

    if (level === 30) {
      rewards.push({
        itemName: 'Master Training Manual',
        itemId: 'training_manual_master',
        quantity: 1,
        rarity: 'epic'
      });
      rewards.push({
        itemName: 'Ascension Crystal',
        itemId: 'ascension_crystal',
        quantity: 1,
        rarity: 'legendary'
      });
    }

    if (level % 10 === 0 && level > 30) {
      rewards.push({
        itemName: 'Premium Food Pack',
        itemId: 'food_pack_premium',
        quantity: level * 5,
        rarity: 'rare'
      });
    }

    return rewards;
  }

  static async addLevelUpRewardsToInventory(userId: string, rewards: LevelUpReward[]): Promise<void> {
    if (rewards.length === 0) return;

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const currentInventory = userDoc.data().inventory || [];
    const updatedInventory = [...currentInventory];

    for (const reward of rewards) {
      const existingItemIndex = updatedInventory.findIndex(
        (item: any) => item.itemId === reward.itemId
      );

      if (existingItemIndex >= 0) {
        updatedInventory[existingItemIndex].quantity += reward.quantity;
      } else {
        updatedInventory.push({
          itemId: reward.itemId,
          itemName: reward.itemName,
          quantity: reward.quantity,
          rarity: reward.rarity,
          acquiredAt: serverTimestamp()
        });
      }
    }

    await updateDoc(userRef, {
      inventory: updatedInventory,
      updatedAt: serverTimestamp()
    });
  }

  static async grantDailyTreasure(userId: string, petName: string, treasureAmount: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      food: increment(treasureAmount),
      updatedAt: serverTimestamp()
    });
  }
}
