import { Pet, BreedType } from '../types/pet.types';

export interface PassiveIncomeResult {
  foodGenerated: number;
  source: string;
  petName: string;
}

export interface AbilityCheckResult {
  canProceed: boolean;
  modifiedAmount?: number;
  message?: string;
}

export class PetAbilityService {
  static calculatePassiveIncome(pets: Pet[]): PassiveIncomeResult[] {
    const results: PassiveIncomeResult[] = [];
    const now = Date.now();

    pets.forEach(pet => {
      if (pet.evolutionStage === 'base') return;

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

      if (foodPerHour > 0) {
        results.push({
          foodGenerated: foodPerHour,
          source: pet.evolutionStage === 'evolved' ? 'Evolved Ability' : 'Ascended Ability',
          petName: pet.name
        });
      }
    });

    return results;
  }

  static getTotalPassiveIncomePerHour(pets: Pet[]): number {
    return this.calculatePassiveIncome(pets).reduce((sum, result) => sum + result.foodGenerated, 0);
  }

  static checkProtection(pets: Pet[], lossAmount: number): AbilityCheckResult {
    const rottweiler = pets.find(p => p.breedType === 'rottweiler');

    if (!rottweiler || rottweiler.evolutionStage === 'base') {
      return { canProceed: true, modifiedAmount: lossAmount };
    }

    if (rottweiler.evolutionStage === 'ascended') {
      return {
        canProceed: true,
        modifiedAmount: 0,
        message: `${rottweiler.name} protected you from losing ${lossAmount} Food!`
      };
    }

    if (rottweiler.evolutionStage === 'evolved') {
      const protectedAmount = Math.floor(lossAmount * 0.5);
      return {
        canProceed: true,
        modifiedAmount: lossAmount - protectedAmount,
        message: `${rottweiler.name} protected ${protectedAmount} Food!`
      };
    }

    return { canProceed: true, modifiedAmount: lossAmount };
  }

  static getSimultaneousTaskSlots(pets: Pet[]): number {
    const bulldog = pets.find(p => p.breedType === 'bulldog');

    if (!bulldog || bulldog.evolutionStage === 'base') {
      return 1;
    }

    if (bulldog.evolutionStage === 'ascended') {
      return 3;
    }

    if (bulldog.evolutionStage === 'evolved') {
      return 2;
    }

    return 1;
  }

  static hasNoCooldown(pets: Pet[], gameType: 'mini-game'): boolean {
    const doberman = pets.find(p => p.breedType === 'doberman');

    if (!doberman) return false;

    if (doberman.evolutionStage === 'ascended' && gameType === 'mini-game') {
      return true;
    }

    return false;
  }

  static canPlayDuringCooldown(pets: Pet[], gameType: 'mini-game'): boolean {
    const doberman = pets.find(p => p.breedType === 'doberman');

    if (!doberman) return false;

    if ((doberman.evolutionStage === 'evolved' || doberman.evolutionStage === 'ascended') && gameType === 'mini-game') {
      return true;
    }

    return false;
  }

  static applyRewardMultipliers(pets: Pet[], baseReward: number, source: 'feeding' | 'task' | 'minigame' | 'boss'): number {
    let multiplier = 1.0;

    pets.forEach(pet => {
      if (pet.evolutionStage === 'base') return;

      switch (pet.breedType) {
        case 'golden_retriever':
          if (source === 'feeding' && pet.evolutionStage === 'evolved') {
            multiplier *= 1.15;
          }
          break;

        case 'husky':
          if (source === 'minigame' && pet.evolutionStage === 'evolved') {
            multiplier *= 1.20;
          }
          break;

        case 'shiba_inu':
          if (pet.evolutionStage === 'evolved') {
            multiplier *= 1.20;
          }
          if (pet.evolutionStage === 'ascended' && Math.random() < 0.1) {
            multiplier *= 3.0;
          }
          break;

        case 'corgi':
          if (source === 'minigame' && pet.evolutionStage === 'evolved') {
            multiplier *= 1.25;
          }
          break;

        case 'poodle':
          if (pet.evolutionStage === 'evolved') {
            multiplier *= 1.30;
          }
          break;

        case 'akita_dragon':
          if (source === 'feeding' && pet.evolutionStage === 'evolved') {
            multiplier *= 1.30;
          }
          if (pet.evolutionStage === 'ascended' && Math.random() < 0.2) {
            multiplier *= 3.0;
          }
          break;

        case 'dalmatian':
          if (pet.evolutionStage === 'ascended' && Math.random() < 0.3) {
            multiplier *= 3.0;
          }
          break;

        case 'chihuahua':
          if (source === 'boss') {
            multiplier *= pet.evolutionStage === 'evolved' ? 2.0 : 3.0;
          }
          break;

        case 'doberman':
          if (source === 'minigame' && pet.evolutionStage === 'ascended') {
            multiplier *= 1.50;
          }
          break;
      }
    });

    return Math.floor(baseReward * multiplier);
  }

  static getXPBonus(pets: Pet[]): number {
    let bonus = 0;

    pets.forEach(pet => {
      switch (pet.breedType) {
        case 'german_shepherd':
          if (pet.evolutionStage === 'ascended') {
            bonus += 0.10;
          }
          break;

        case 'samoyed':
          if (pet.evolutionStage === 'ascended') {
            bonus += 0.15;
          }
          break;
      }
    });

    return bonus;
  }

  static getTrainingCostReduction(pets: Pet[]): number {
    const borderCollie = pets.find(p => p.breedType === 'border_collie');

    if (!borderCollie || borderCollie.evolutionStage === 'base') {
      return 0;
    }

    return 0.30;
  }

  static applyDailyAbilities(pets: Pet[]): { treasure?: number; rareItems?: string[] } {
    const result: { treasure?: number; rareItems?: string[] } = {};

    pets.forEach(pet => {
      if (pet.breedType === 'dachshund' && pet.evolutionStage === 'ascended') {
        result.treasure = Math.floor(Math.random() * 50) + 20;
      }

      if (pet.breedType === 'dachshund' && pet.evolutionStage === 'evolved') {
        if (Math.random() < 0.15) {
          result.treasure = Math.floor(Math.random() * 20) + 10;
        }
      }
    });

    return result;
  }
}
