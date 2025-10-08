import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GameSettings {
  startingBalance: number;
  startingTickets: number;
  dailyFreeTickets: number;
  ticketsPerLevel: number;
  ticketsPerTask: number;
  miningCooldown: number;
  energyRegenRate: number;
  referralBonus: number;
  referralPercentage: number;
}

export interface BoostSettings {
  foodBoostCost: number;
  foodBoostMultiplier: number;
  foodBoostDuration: number;
  expBoostCost: number;
  expBoostMultiplier: number;
  expBoostDuration: number;
}

export interface UpgradeSettings {
  autoFeederCost: number;
  happinessBoosterCost: number;
  happinessBoosterMultiplier: number;
  miningPowerBaseCost: number;
  energyCapacityBaseCost: number;
  efficiencyBaseCost: number;
  upgradeCostMultiplier: number;
}

export interface ShopSettings {
  smallTreatCost: number;
  smallTreatEnergy: number;
  largeTreatCost: number;
  largeTreatEnergy: number;
}

export interface GameRewards {
  pupFiCatcherBonePoints: number;
  pupFiCatcherMeatPoints: number;
  pupFiCatcherBombPenalty: number;
  memoryMatchBaseReward: number;
  puzzleBaseReward: number;
  racingBaseReward: number;
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export interface SystemSettings {
  gameSettings: GameSettings;
  boostSettings: BoostSettings;
  upgradeSettings: UpgradeSettings;
  shopSettings: ShopSettings;
  gameRewards: GameRewards;
  maintenanceMode: MaintenanceMode;
  updatedAt?: any;
}

const SETTINGS_DOC_ID = 'systemSettings';

const DEFAULT_SETTINGS: SystemSettings = {
  gameSettings: {
    startingBalance: 1000,
    startingTickets: 5,
    dailyFreeTickets: 5,
    ticketsPerLevel: 2,
    ticketsPerTask: 1,
    miningCooldown: 1,
    energyRegenRate: 5,
    referralBonus: 100,
    referralPercentage: 10
  },
  boostSettings: {
    foodBoostCost: 50,
    foodBoostMultiplier: 2,
    foodBoostDuration: 3600,
    expBoostCost: 40,
    expBoostMultiplier: 2,
    expBoostDuration: 3600
  },
  upgradeSettings: {
    autoFeederCost: 500,
    happinessBoosterCost: 800,
    happinessBoosterMultiplier: 1.5,
    miningPowerBaseCost: 100,
    energyCapacityBaseCost: 80,
    efficiencyBaseCost: 150,
    upgradeCostMultiplier: 1.5
  },
  shopSettings: {
    smallTreatCost: 10,
    smallTreatEnergy: 50,
    largeTreatCost: 25,
    largeTreatEnergy: 150
  },
  gameRewards: {
    pupFiCatcherBonePoints: 5,
    pupFiCatcherMeatPoints: 15,
    pupFiCatcherBombPenalty: 15,
    memoryMatchBaseReward: 50,
    puzzleBaseReward: 75,
    racingBaseReward: 100
  },
  maintenanceMode: {
    enabled: false,
    message: 'System is under maintenance. Please check back soon!'
  }
};

export class SettingsService {
  static async getSettings(): Promise<SystemSettings> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as SystemSettings;
    }

    await this.initializeSettings();
    return DEFAULT_SETTINGS;
  }

  static async initializeSettings(): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    await setDoc(docRef, {
      ...DEFAULT_SETTINGS,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Initialized default settings');
  }

  static async updateGameSettings(settings: GameSettings): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const currentSettings = await this.getSettings();

    await setDoc(docRef, {
      ...currentSettings,
      gameSettings: settings,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Updated game settings');
  }

  static async updateBoostSettings(settings: BoostSettings): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const currentSettings = await this.getSettings();

    await setDoc(docRef, {
      ...currentSettings,
      boostSettings: settings,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Updated boost settings');
  }

  static async updateUpgradeSettings(settings: UpgradeSettings): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const currentSettings = await this.getSettings();

    await setDoc(docRef, {
      ...currentSettings,
      upgradeSettings: settings,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Updated upgrade settings');
  }

  static async updateShopSettings(settings: ShopSettings): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const currentSettings = await this.getSettings();

    await setDoc(docRef, {
      ...currentSettings,
      shopSettings: settings,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Updated shop settings');
  }

  static async updateGameRewards(settings: GameRewards): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const currentSettings = await this.getSettings();

    await setDoc(docRef, {
      ...currentSettings,
      gameRewards: settings,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Updated game rewards');
  }

  static async updateMaintenanceMode(settings: MaintenanceMode): Promise<void> {
    const docRef = doc(db, 'systemSettings', SETTINGS_DOC_ID);
    const currentSettings = await this.getSettings();

    await setDoc(docRef, {
      ...currentSettings,
      maintenanceMode: settings,
      updatedAt: serverTimestamp()
    });
    console.log('⚙️ SettingsService: Updated maintenance mode');
  }

  static async getGameSettings(): Promise<GameSettings> {
    const settings = await this.getSettings();
    return settings.gameSettings;
  }

  static async getBoostSettings(): Promise<BoostSettings> {
    const settings = await this.getSettings();
    return settings.boostSettings;
  }

  static async getUpgradeSettings(): Promise<UpgradeSettings> {
    const settings = await this.getSettings();
    return settings.upgradeSettings;
  }

  static async getShopSettings(): Promise<ShopSettings> {
    const settings = await this.getSettings();
    return settings.shopSettings;
  }

  static async getGameRewards(): Promise<GameRewards> {
    const settings = await this.getSettings();
    return settings.gameRewards;
  }

  static async getMaintenanceMode(): Promise<MaintenanceMode> {
    const settings = await this.getSettings();
    return settings.maintenanceMode;
  }
}
