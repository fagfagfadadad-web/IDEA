import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Initialize default tasks
const defaultTasks = [
  {
    title: 'First Mining Operation',
    description: 'Complete your first mining operation with any ship',
    rewardAmount: 50,
    taskType: 'mining',
    requirements: { miningOperations: 1 },
    isActive: true
  },
  {
    title: 'Daily Miner',
    description: 'Mine PupFi tokens 5 times in a single day',
    rewardAmount: 100,
    taskType: 'daily',
    requirements: { dailyMiningCount: 5 },
    isActive: true
  },
  {
    title: 'Ship Collector',
    description: 'Own 3 different ships in your fleet',
    rewardAmount: 200,
    taskType: 'mining',
    requirements: { shipCount: 3 },
    isActive: true
  },
  {
    title: 'Referral Master',
    description: 'Refer 5 new players to the game',
    rewardAmount: 500,
    taskType: 'referral',
    requirements: { referralCount: 5 },
    isActive: true
  },
  {
    title: 'Level Up',
    description: 'Reach mining level 5',
    rewardAmount: 300,
    taskType: 'mining',
    requirements: { requiredLevel: 5 },
    isActive: true
  },
  {
    title: 'Energy Efficient',
    description: 'Complete 10 mining operations without running out of energy',
    rewardAmount: 150,
    taskType: 'mining',
    requirements: { efficientMining: 10 },
    isActive: true
  }
];

export const initializeFirestore = async () => {
  try {
    console.log('Initializing Firestore with default data...');
    
    // Add default tasks
    for (const task of defaultTasks) {
      await addDoc(collection(db, 'tasks'), {
        ...task,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('✅ Firestore initialized successfully!');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
};