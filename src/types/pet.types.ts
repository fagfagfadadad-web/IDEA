import { Timestamp } from 'firebase/firestore';

export type BreedType =
  | 'golden_retriever'
  | 'husky'
  | 'german_shepherd'
  | 'corgi'
  | 'poodle'
  | 'mystical_wolf'
  | 'celestial_hound'
  | 'akita_dragon'
  | 'shiba_inu'
  | 'border_collie'
  | 'beagle'
  | 'dachshund'
  | 'pomeranian'
  | 'dalmatian'
  | 'bulldog'
  | 'samoyed'
  | 'labrador'
  | 'chihuahua'
  | 'rottweiler'
  | 'doberman';

export type EvolutionStage = 'base' | 'evolved' | 'ascended';

export type TrainingType = 'agility' | 'obedience' | 'intelligence';

export type PersonalityType = 'playful' | 'calm' | 'energetic' | 'loyal';

export interface PetAbility {
  abilityId: string;
  name: string;
  effect: string;
  multiplier?: number;
  unlockedAt: Timestamp;
}

export interface TrainingStats {
  agility: number;
  obedience: number;
  intelligence: number;
}

export interface ActivityStats {
  totalFeedings: number;
  totalGamesPlayed: number;
  totalTasksCompleted: number;
  totalTrainingSessions: number;
}

export interface Pet {
  id?: string;
  userId: string;
  petId: string;
  breedType: BreedType;
  name: string;

  level: number;
  currentXP: number;
  totalXP: number;
  evolutionStage: EvolutionStage;

  abilities: PetAbility[];
  training: TrainingStats;
  stats: ActivityStats;
  equippedItems?: string[];

  isShiny: boolean;
  shinyVariant?: string;
  personality: PersonalityType;

  marketValue: number;
  isListed?: boolean;

  aiImageUrl?: string;
  aiImageData?: string;
  aiImagePrompt?: string;
  hasCustomImage?: boolean;

  adoptedAt: Timestamp;
  lastEvolutionAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MarketListing {
  id?: string;
  petId: string;
  pet?: Pet;
  sellerId: string;
  sellerUsername: string;

  breedType: BreedType;
  level: number;
  evolutionStage: EvolutionStage;
  abilities: string[];
  isShiny: boolean;

  listingType: 'fixed_price' | 'auction';
  price: number;

  auctionEndTime?: Timestamp;
  currentBid?: number;
  currentBidder?: string;
  minimumBid?: number;

  status: 'active' | 'sold' | 'cancelled' | 'expired';

  listedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PetOwnershipHistory {
  id?: string;
  petId: string;
  fromUserId: string;
  fromUsername?: string;
  toUserId: string;
  toUsername?: string;
  transferType: 'adoption' | 'purchase' | 'trade' | 'gift';
  price?: number;
  priceChangePercent?: number;
  marketplaceListingId?: string;
  transferredAt: Timestamp;
}

export interface EvolutionLog {
  id?: string;
  petId: string;
  userId: string;
  fromStage: EvolutionStage;
  toStage: EvolutionStage;
  levelAchieved: number;
  totalXP: number;
  newAbilities: string[];
  evolvedAt: Timestamp;
}

export const BREED_INFO: Record<BreedType, {
  name: string;
  emoji: string;
  basePrice: number;
  description: string;
  abilities: {
    evolved: { name: string; effect: string; multiplier?: number };
    ascended: { name: string; effect: string; multiplier?: number };
  };
}> = {
  golden_retriever: {
    name: 'Golden Retriever',
    emoji: '🦮',
    basePrice: 100,
    description: 'Loyal and friendly companion',
    abilities: {
      evolved: { name: 'Loyal Heart', effect: 'Food from feeding', multiplier: 1.15 },
      ascended: { name: 'Golden Spirit', effect: '10% chance to double task rewards' }
    }
  },
  husky: {
    name: 'Husky Explorer',
    emoji: '🐺',
    basePrice: 150,
    description: 'Adventurous and energetic',
    abilities: {
      evolved: { name: 'Frost Trail', effect: 'XP from mini-games', multiplier: 1.20 },
      ascended: { name: 'Arctic Endurance', effect: 'Reduces cooldowns by 15%' }
    }
  },
  german_shepherd: {
    name: 'German Shepherd',
    emoji: '🐕‍🦺',
    basePrice: 200,
    description: 'Protective and intelligent',
    abilities: {
      evolved: { name: 'Guardian Instinct', effect: 'All pets gain +5% happiness' },
      ascended: { name: 'Alpha Pack Leader', effect: 'All pets gain +10% XP' }
    }
  },
  corgi: {
    name: 'Royal Corgi',
    emoji: '👑',
    basePrice: 300,
    description: 'Noble and charming',
    abilities: {
      evolved: { name: 'Royal Aura', effect: 'Mini-game rewards', multiplier: 1.25 },
      ascended: { name: 'Crown Jewels', effect: '15% chance for bonus tickets' }
    }
  },
  poodle: {
    name: 'Elegant Poodle',
    emoji: '🐩',
    basePrice: 250,
    description: 'Elegant and agile',
    abilities: {
      evolved: { name: 'Graceful Moves', effect: 'Agility training success', multiplier: 1.30 },
      ascended: { name: 'Perfect Form', effect: 'Training grants 2x XP' }
    }
  },
  mystical_wolf: {
    name: 'Mystical Wolf',
    emoji: '🐺✨',
    basePrice: 500,
    description: 'Ancient magical creature',
    abilities: {
      evolved: { name: 'Spirit Howl', effect: 'Generates 5 Food/hour passively' },
      ascended: { name: 'Moonlight Blessing', effect: 'Generates 15 Food/hour + 10% boost to all pets' }
    }
  },
  celestial_hound: {
    name: 'Celestial Hound',
    emoji: '🌟',
    basePrice: 1000,
    description: 'Divine guardian from the stars',
    abilities: {
      evolved: { name: 'Divine Blessing', effect: '20% chance for rare drops' },
      ascended: { name: 'Cosmic Ascension', effect: 'Once per day: instant complete any task' }
    }
  },
  akita_dragon: {
    name: 'Akita Dragon',
    emoji: '🔥',
    basePrice: 750,
    description: 'Fierce and loyal warrior',
    abilities: {
      evolved: { name: 'Dragon Breath', effect: 'Food from feeding', multiplier: 1.30 },
      ascended: { name: 'Dragon\'s Fury', effect: '20% chance for 3x game rewards' }
    }
  },
  shiba_inu: {
    name: 'Shiba Inu',
    emoji: '🦊',
    basePrice: 180,
    description: 'To The Moon! Meme legend',
    abilities: {
      evolved: { name: 'Doge Power', effect: 'Food rewards', multiplier: 1.20 },
      ascended: { name: 'To The Moon', effect: 'Triple Food rewards on random events' }
    }
  },
  border_collie: {
    name: 'Border Collie',
    emoji: '🐑',
    basePrice: 220,
    description: 'Super intelligent herding dog',
    abilities: {
      evolved: { name: 'Quick Learner', effect: 'Training cost reduced by 30%' },
      ascended: { name: 'Genius Mind', effect: 'All training costs -30%, intelligence training 2x effective' }
    }
  },
  beagle: {
    name: 'Beagle',
    emoji: '👃',
    basePrice: 140,
    description: 'Master tracker with super nose',
    abilities: {
      evolved: { name: 'Scent Hunter', effect: 'Finds bonus Food every hour' },
      ascended: { name: 'Treasure Nose', effect: 'Finds 10 Food every hour + rare items' }
    }
  },
  dachshund: {
    name: 'Dachshund',
    emoji: '🌭',
    basePrice: 130,
    description: 'Small but finds hidden treasures',
    abilities: {
      evolved: { name: 'Treasure Digger', effect: '15% chance to find hidden Food' },
      ascended: { name: 'Vault Finder', effect: 'Daily treasure chest with random rewards' }
    }
  },
  pomeranian: {
    name: 'Pomeranian',
    emoji: '🧸',
    basePrice: 160,
    description: 'Viral star with passive income',
    abilities: {
      evolved: { name: 'Viral Pup', effect: 'Generates 3 Food/hour from fame' },
      ascended: { name: 'Internet Star', effect: 'Generates 10 Food/hour + bonus from referrals' }
    }
  },
  dalmatian: {
    name: 'Dalmatian',
    emoji: '🐕',
    basePrice: 240,
    description: 'Critical hits and speed master',
    abilities: {
      evolved: { name: 'Spotted Sprint', effect: 'Actions 25% faster' },
      ascended: { name: 'Critical Strike', effect: '30% chance for critical rewards (3x)' }
    }
  },
  bulldog: {
    name: 'Bulldog',
    emoji: '💪',
    basePrice: 190,
    description: 'Can do 2 tasks at once',
    abilities: {
      evolved: { name: 'Strong Will', effect: 'Can complete 2 tasks simultaneously' },
      ascended: { name: 'Unstoppable', effect: '3 simultaneous tasks + reduced task time' }
    }
  },
  samoyed: {
    name: 'Samoyed',
    emoji: '☁️',
    basePrice: 280,
    description: 'Fluffy cloud of happiness',
    abilities: {
      evolved: { name: 'Happy Cloud', effect: 'All pets gain +10% happiness' },
      ascended: { name: 'Joy Aura', effect: 'All pets +20% happiness and +15% XP' }
    }
  },
  labrador: {
    name: 'Labrador Retriever',
    emoji: '🦴',
    basePrice: 170,
    description: 'Best friend who shares rewards',
    abilities: {
      evolved: { name: 'Best Friend', effect: 'Shares 10% of rewards with other pets' },
      ascended: { name: 'Pack Leader', effect: 'All pets share 15% rewards with each other' }
    }
  },
  chihuahua: {
    name: 'Chihuahua',
    emoji: '🐭',
    basePrice: 110,
    description: 'Small but mighty boss killer',
    abilities: {
      evolved: { name: 'Tiny Terror', effect: 'Boss rewards', multiplier: 2.0 },
      ascended: { name: 'Giant Slayer', effect: '3x boss rewards + 50% faster boss cooldown' }
    }
  },
  rottweiler: {
    name: 'Rottweiler',
    emoji: '🛡️',
    basePrice: 260,
    description: 'Protects against Food loss',
    abilities: {
      evolved: { name: 'Guardian', effect: 'Prevents 50% of Food loss from failed actions' },
      ascended: { name: 'Iron Guard', effect: 'Complete protection from Food loss + theft prevention' }
    }
  },
  doberman: {
    name: 'Doberman Pinscher',
    emoji: '⚡',
    basePrice: 270,
    description: 'Can play games twice during cooldown',
    abilities: {
      evolved: { name: 'Speed Demon', effect: 'Can play games 2x during cooldown' },
      ascended: { name: 'Time Warp', effect: 'No cooldown on mini-games + 50% bonus rewards' }
    }
  }
};

export const XP_REQUIREMENTS = {
  calculateXPForLevel: (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  },

  getTotalXPForLevel: (targetLevel: number): number => {
    let total = 0;
    for (let i = 1; i < targetLevel; i++) {
      total += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    return total;
  },

  getEvolutionThresholds: () => ({
    evolved: 10,
    ascended: 30
  })
};

export const XP_SOURCES = {
  feeding: 10,
  miniGameWinEasy: 25,
  miniGameWinHard: 50,
  taskCompletion: 100,
  training: 30,
  dailyCare: 15,
  referralCompleted: 200
};

export const EVOLUTION_MULTIPLIERS = {
  base: {
    food: 1.0,
    xp: 1.0,
    cooldown: 1.0
  },
  evolved: {
    food: 1.2,
    xp: 1.2,
    cooldown: 0.85
  },
  ascended: {
    food: 1.5,
    xp: 1.5,
    cooldown: 0.7
  }
};
