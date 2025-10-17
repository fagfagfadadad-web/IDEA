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

    const getRandomItem = (pool: LevelUpReward[]): LevelUpReward => {
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const commonItems: LevelUpReward[] = [
      { itemName: 'XP Treat', itemId: 'xp_treat', quantity: 1, rarity: 'common' },
      { itemName: 'XP Treat', itemId: 'xp_treat', quantity: 2, rarity: 'common' },
      { itemName: 'Food Pack', itemId: 'food_pack_small', quantity: 25, rarity: 'common' },
      { itemName: 'Food Pack', itemId: 'food_pack_small', quantity: 50, rarity: 'common' },
    ];

    const rareItems: LevelUpReward[] = [
      { itemName: 'XP Snack Pack', itemId: 'xp_snack_pack', quantity: 1, rarity: 'rare' },
      { itemName: 'Training Manual', itemId: 'training_manual', quantity: 1, rarity: 'rare' },
      { itemName: 'Food Pack', itemId: 'food_pack_medium', quantity: 100, rarity: 'rare' },
    ];

    const epicItems: LevelUpReward[] = [
      { itemName: 'XP Feast', itemId: 'xp_feast', quantity: 1, rarity: 'epic' },
      { itemName: 'Evolution Stone', itemId: 'evolution_stone', quantity: 1, rarity: 'epic' },
      { itemName: 'Training Boost (24h)', itemId: 'training_boost_24h', quantity: 1, rarity: 'epic' },
    ];

    const legendaryItems: LevelUpReward[] = [
      { itemName: 'XP Multiplier (24h)', itemId: 'xp_multiplier_24h', quantity: 1, rarity: 'legendary' },
      { itemName: 'Shiny Charm', itemId: 'shiny_charm', quantity: 1, rarity: 'legendary' },
      { itemName: 'Food Multiplier Upgrade', itemId: 'food_multiplier_upgrade', quantity: 1, rarity: 'legendary' },
    ];

    if (level === 5) {
      rewards.push(getRandomItem(commonItems));
      if (Math.random() > 0.5) {
        rewards.push(getRandomItem(commonItems));
      }
    }

    if (level === 10) {
      rewards.push(getRandomItem(commonItems));
      rewards.push(getRandomItem(rareItems));
    }

    if (level === 15) {
      rewards.push(getRandomItem(rareItems));
      if (Math.random() > 0.6) {
        rewards.push(getRandomItem(commonItems));
      }
    }

    if (level === 20) {
      rewards.push(getRandomItem(rareItems));
      rewards.push(getRandomItem(epicItems));
    }

    if (level === 25) {
      rewards.push(getRandomItem(epicItems));
      if (Math.random() > 0.5) {
        rewards.push(getRandomItem(rareItems));
      }
    }

    if (level === 30) {
      rewards.push(getRandomItem(epicItems));
      rewards.push(getRandomItem(legendaryItems));
    }

    if (level === 40) {
      rewards.push(getRandomItem(legendaryItems));
      rewards.push(getRandomItem(epicItems));
    }

    if (level === 50) {
      rewards.push(getRandomItem(legendaryItems));
      rewards.push(getRandomItem(legendaryItems));
      rewards.push(getRandomItem(epicItems));
    }

    if (level % 5 === 0 && level > 10 && level < 50) {
      if (Math.random() > 0.7) {
        rewards.push(getRandomItem(commonItems));
      }
    }

    if (level % 10 === 0 && level > 50) {
      rewards.push(getRandomItem(epicItems));
      rewards.push({
        itemName: 'Food Pack',
        itemId: 'food_pack_large',
        quantity: level * 3,
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
