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
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Pet,
  MarketListing,
  PetOwnershipHistory,
  EvolutionLog,
  BreedType,
  EvolutionStage,
  TrainingType,
  BREED_INFO,
  XP_REQUIREMENTS,
  XP_SOURCES,
  EVOLUTION_MULTIPLIERS
} from '../types/pet.types';

export class PetService {
  static async adoptPet(userId: string, breedType: BreedType, petName: string): Promise<string> {
    try {
      const isShiny = Math.random() < 0.01;
      const personalities = ['playful', 'calm', 'energetic', 'loyal'];
      const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

      const petData: any = {
        userId,
        petId: `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        breedType,
        name: petName,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        evolutionStage: 'base',
        abilities: [],
        training: {
          agility: 0,
          obedience: 0,
          intelligence: 0
        },
        stats: {
          totalFeedings: 0,
          totalGamesPlayed: 0,
          totalTasksCompleted: 0,
          totalTrainingSessions: 0
        },
        isShiny,
        personality: randomPersonality,
        marketValue: BREED_INFO[breedType].basePrice,
        isListed: false,
        adoptedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (isShiny) {
        petData.shinyVariant = Math.random() > 0.5 ? 'golden' : 'silver';
      }

      const docRef = await addDoc(collection(db, 'pets'), petData);

      await addDoc(collection(db, 'petOwnershipHistory'), {
        petId: petData.petId,
        fromUserId: 'system',
        toUserId: userId,
        transferType: 'adoption',
        transferredAt: serverTimestamp()
      });

      console.log('🐕 Pet adopted successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adopting pet:', error);
      throw error;
    }
  }

  static async getUserPets(userId: string): Promise<Pet[]> {
    try {
      const q = query(
        collection(db, 'pets'),
        where('userId', '==', userId),
        where('isListed', '==', false)
      );

      const snapshot = await getDocs(q);
      const pets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Pet));

      return pets.sort((a, b) => b.level - a.level);
    } catch (error) {
      console.error('❌ Error fetching user pets:', error);
      return [];
    }
  }

  static async getPetById(petId: string): Promise<Pet | null> {
    try {
      const petDoc = await getDoc(doc(db, 'pets', petId));
      if (petDoc.exists()) {
        return { id: petDoc.id, ...petDoc.data() } as Pet;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching pet:', error);
      return null;
    }
  }

  static async addXP(
    petDocId: string,
    xpAmount: number,
    source: string
  ): Promise<{ leveled: boolean; evolved: boolean; newLevel?: number; newStage?: EvolutionStage }> {
    try {
      const petRef = doc(db, 'pets', petDocId);
      const petDoc = await getDoc(petRef);

      if (!petDoc.exists()) {
        throw new Error('Pet not found');
      }

      const pet = petDoc.data() as Pet;
      const multiplier = EVOLUTION_MULTIPLIERS[pet.evolutionStage].xp;
      const actualXP = Math.floor(xpAmount * multiplier);

      let newCurrentXP = pet.currentXP + actualXP;
      let newTotalXP = pet.totalXP + actualXP;
      let newLevel = pet.level;
      let leveled = false;
      let evolved = false;
      let newStage = pet.evolutionStage;

      let xpNeeded = XP_REQUIREMENTS.calculateXPForLevel(newLevel);

      while (newCurrentXP >= xpNeeded) {
        newCurrentXP -= xpNeeded;
        newLevel++;
        leveled = true;
        xpNeeded = XP_REQUIREMENTS.calculateXPForLevel(newLevel);
      }

      const thresholds = XP_REQUIREMENTS.getEvolutionThresholds();
      if (newLevel >= thresholds.ascended && pet.evolutionStage !== 'ascended') {
        newStage = 'ascended';
        evolved = true;
        await this.triggerEvolution(petDocId, pet, 'ascended', newLevel, newTotalXP);
      } else if (newLevel >= thresholds.evolved && pet.evolutionStage === 'base') {
        newStage = 'evolved';
        evolved = true;
        await this.triggerEvolution(petDocId, pet, 'evolved', newLevel, newTotalXP);
      }

      await updateDoc(petRef, {
        level: newLevel,
        currentXP: newCurrentXP,
        totalXP: newTotalXP,
        evolutionStage: newStage,
        marketValue: this.calculateMarketValue(pet.breedType, newLevel, newStage, pet.isShiny),
        updatedAt: serverTimestamp()
      });

      console.log(`✨ Pet gained ${actualXP} XP from ${source}. Level: ${newLevel}, Stage: ${newStage}`);

      return { leveled, evolved, newLevel, newStage };
    } catch (error) {
      console.error('❌ Error adding XP:', error);
      throw error;
    }
  }

  private static async triggerEvolution(
    petDocId: string,
    pet: Pet,
    newStage: EvolutionStage,
    level: number,
    totalXP: number
  ): Promise<void> {
    try {
      const breedAbilities = BREED_INFO[pet.breedType].abilities;
      const newAbility =
        newStage === 'evolved' ? breedAbilities.evolved : breedAbilities.ascended;

      const abilityData = {
        abilityId: `${pet.breedType}_${newStage}`,
        name: newAbility.name,
        effect: newAbility.effect,
        multiplier: newAbility.multiplier,
        unlockedAt: serverTimestamp() as Timestamp
      };

      const petRef = doc(db, 'pets', petDocId);
      const currentPet = await getDoc(petRef);
      const currentAbilities = currentPet.data()?.abilities || [];

      await updateDoc(petRef, {
        abilities: [...currentAbilities, abilityData],
        lastEvolutionAt: serverTimestamp()
      });

      await addDoc(collection(db, 'evolutionLog'), {
        petId: pet.petId,
        userId: pet.userId,
        fromStage: pet.evolutionStage,
        toStage: newStage,
        levelAchieved: level,
        totalXP,
        newAbilities: [newAbility.name],
        evolvedAt: serverTimestamp()
      });

      console.log(`🌟 Pet evolved to ${newStage}! Unlocked: ${newAbility.name}`);
    } catch (error) {
      console.error('❌ Error triggering evolution:', error);
    }
  }

  static async trainPet(
    petDocId: string,
    trainingType: TrainingType
  ): Promise<{ leveled: boolean; evolved: boolean; newLevel?: number; newStage?: EvolutionStage }> {
    try {
      const petRef = doc(db, 'pets', petDocId);
      const petDoc = await getDoc(petRef);

      if (!petDoc.exists()) {
        throw new Error('Pet not found');
      }

      const pet = petDoc.data() as Pet;
      const currentValue = pet.training[trainingType];
      const increment = Math.min(5, 100 - currentValue);

      await updateDoc(petRef, {
        [`training.${trainingType}`]: currentValue + increment,
        'stats.totalTrainingSessions': pet.stats.totalTrainingSessions + 1,
        updatedAt: serverTimestamp()
      });

      const result = await this.addXP(petDocId, XP_SOURCES.training, `${trainingType} training`);

      console.log(`💪 Pet trained in ${trainingType}. New value: ${currentValue + increment}`);
      return result;
    } catch (error) {
      console.error('❌ Error training pet:', error);
      throw error;
    }
  }

  static async feedPet(petDocId: string): Promise<void> {
    try {
      const petRef = doc(db, 'pets', petDocId);

      await updateDoc(petRef, {
        'stats.totalFeedings': increment(1),
        updatedAt: serverTimestamp()
      });

      await this.addXP(petDocId, XP_SOURCES.feeding, 'feeding');

      console.log('🍖 Pet fed successfully');
    } catch (error) {
      console.error('❌ Error feeding pet:', error);
      throw error;
    }
  }

  static async recordGamePlayed(petDocId: string, won: boolean): Promise<void> {
    try {
      const petRef = doc(db, 'pets', petDocId);

      await updateDoc(petRef, {
        'stats.totalGamesPlayed': increment(1),
        updatedAt: serverTimestamp()
      });

      if (won) {
        await this.addXP(petDocId, XP_SOURCES.miniGameWinEasy, 'mini-game win');
      }

      console.log(`🎮 Game recorded. Won: ${won}`);
    } catch (error) {
      console.error('❌ Error recording game:', error);
      throw error;
    }
  }

  static async recordTaskCompleted(petDocId: string): Promise<void> {
    try {
      const petRef = doc(db, 'pets', petDocId);

      await updateDoc(petRef, {
        'stats.totalTasksCompleted': increment(1),
        updatedAt: serverTimestamp()
      });

      await this.addXP(petDocId, XP_SOURCES.taskCompletion, 'task completion');

      console.log('✅ Task completion recorded');
    } catch (error) {
      console.error('❌ Error recording task:', error);
      throw error;
    }
  }

  static calculateMarketValue(
    breedType: BreedType,
    level: number,
    stage: EvolutionStage,
    isShiny: boolean
  ): number {
    const basePrice = BREED_INFO[breedType].basePrice;
    const levelMultiplier = 1 + (level * 0.1);
    const stageMultiplier = stage === 'base' ? 1 : stage === 'evolved' ? 3 : 10;
    const shinyMultiplier = isShiny ? 5 : 1;

    return Math.floor(basePrice * levelMultiplier * stageMultiplier * shinyMultiplier);
  }

  static async listPetOnMarket(
    petDocId: string,
    sellerId: string,
    sellerUsername: string,
    price: number
  ): Promise<string> {
    try {
      const petDoc = await getDoc(doc(db, 'pets', petDocId));
      if (!petDoc.exists()) {
        throw new Error('Pet not found');
      }

      const pet = petDoc.data() as Pet;

      if (pet.userId !== sellerId) {
        throw new Error('You do not own this pet');
      }

      const listingData: Omit<MarketListing, 'id'> = {
        petId: pet.petId,
        sellerId,
        sellerUsername,
        breedType: pet.breedType,
        level: pet.level,
        evolutionStage: pet.evolutionStage,
        abilities: pet.abilities.map(a => a.name),
        isShiny: pet.isShiny,
        listingType: 'fixed_price',
        price,
        status: 'active',
        listedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      const listingRef = await addDoc(collection(db, 'marketListings'), listingData);

      await updateDoc(doc(db, 'pets', petDocId), {
        isListed: true,
        updatedAt: serverTimestamp()
      });

      console.log('📝 Pet listed on market:', listingRef.id);
      return listingRef.id;
    } catch (error) {
      console.error('❌ Error listing pet:', error);
      throw error;
    }
  }

  static async getMarketListings(filters?: {
    breedType?: BreedType;
    minLevel?: number;
    maxLevel?: number;
    evolutionStage?: EvolutionStage;
  }): Promise<MarketListing[]> {
    try {
      const q = query(
        collection(db, 'marketListings'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      let listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MarketListing));

      listings.sort((a, b) => {
        const aTime = a.listedAt as any;
        const bTime = b.listedAt as any;
        return (bTime?.seconds || 0) - (aTime?.seconds || 0);
      });

      if (filters) {
        if (filters.breedType) {
          listings = listings.filter(l => l.breedType === filters.breedType);
        }
        if (filters.minLevel) {
          listings = listings.filter(l => l.level >= filters.minLevel!);
        }
        if (filters.maxLevel) {
          listings = listings.filter(l => l.level <= filters.maxLevel!);
        }
        if (filters.evolutionStage) {
          listings = listings.filter(l => l.evolutionStage === filters.evolutionStage);
        }
      }

      return listings;
    } catch (error) {
      console.error('❌ Error fetching market listings:', error);
      return [];
    }
  }

  static async purchasePet(
    listingId: string,
    buyerId: string,
    buyerUsername: string
  ): Promise<{ success: boolean; petId?: string; error?: string }> {
    try {
      const listingDoc = await getDoc(doc(db, 'marketListings', listingId));
      if (!listingDoc.exists()) {
        return { success: false, error: 'Listing not found' };
      }

      const listing = listingDoc.data() as MarketListing;

      if (listing.status !== 'active') {
        return { success: false, error: 'Listing is no longer active' };
      }

      if (listing.sellerId === buyerId) {
        return { success: false, error: 'Cannot buy your own pet' };
      }

      const petsQuery = query(
        collection(db, 'pets'),
        where('petId', '==', listing.petId),
        firestoreLimit(1)
      );
      const petsSnapshot = await getDocs(petsQuery);

      if (petsSnapshot.empty) {
        return { success: false, error: 'Pet not found' };
      }

      const petDoc = petsSnapshot.docs[0];
      const petDocId = petDoc.id;

      const buyerStatsRef = doc(db, 'gameStats', buyerId);
      const buyerStatsDoc = await getDoc(buyerStatsRef);

      if (!buyerStatsDoc.exists()) {
        return { success: false, error: 'Buyer stats not found' };
      }

      const buyerBalance = buyerStatsDoc.data().zenBalance || 0;
      const marketplaceFee = Math.floor(listing.price * 0.05);
      const totalCost = listing.price + marketplaceFee;

      if (buyerBalance < totalCost) {
        return { success: false, error: 'Insufficient balance' };
      }

      const batch = writeBatch(db);

      batch.update(buyerStatsRef, {
        zenBalance: increment(-totalCost),
        updatedAt: serverTimestamp()
      });

      const sellerStatsRef = doc(db, 'gameStats', listing.sellerId);
      batch.update(sellerStatsRef, {
        zenBalance: increment(listing.price - marketplaceFee),
        updatedAt: serverTimestamp()
      });

      batch.update(doc(db, 'pets', petDocId), {
        userId: buyerId,
        isListed: false,
        updatedAt: serverTimestamp()
      });

      batch.update(doc(db, 'marketListings', listingId), {
        status: 'sold',
        updatedAt: serverTimestamp()
      });

      const historyRef = doc(collection(db, 'petOwnershipHistory'));
      batch.set(historyRef, {
        petId: listing.petId,
        fromUserId: listing.sellerId,
        toUserId: buyerId,
        transferType: 'purchase',
        price: listing.price,
        marketplaceListingId: listingId,
        transferredAt: serverTimestamp()
      });

      await batch.commit();

      console.log('✅ Pet purchased successfully');
      return { success: true, petId: petDocId };
    } catch (error) {
      console.error('❌ Error purchasing pet:', error);
      return { success: false, error: 'Transaction failed' };
    }
  }

  static async cancelListing(listingId: string, userId: string): Promise<boolean> {
    try {
      const listingDoc = await getDoc(doc(db, 'marketListings', listingId));
      if (!listingDoc.exists()) {
        return false;
      }

      const listing = listingDoc.data() as MarketListing;

      if (listing.sellerId !== userId) {
        throw new Error('You do not own this listing');
      }

      const petsQuery = query(
        collection(db, 'pets'),
        where('petId', '==', listing.petId),
        firestoreLimit(1)
      );
      const petsSnapshot = await getDocs(petsQuery);

      if (!petsSnapshot.empty) {
        const petDocId = petsSnapshot.docs[0].id;
        await updateDoc(doc(db, 'pets', petDocId), {
          isListed: false,
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(doc(db, 'marketListings', listingId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      console.log('❌ Listing cancelled');
      return true;
    } catch (error) {
      console.error('❌ Error cancelling listing:', error);
      return false;
    }
  }
}
