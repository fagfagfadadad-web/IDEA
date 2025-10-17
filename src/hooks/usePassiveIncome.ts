import { useState, useEffect } from 'react';
import { PassiveIncomeService, PassiveIncomeReward } from '../services/passiveIncomeService';
import { Pet } from '../types/pet.types';

export const usePassiveIncome = (userId: string | undefined, pets: Pet[]) => {
  const [passiveRewards, setPassiveRewards] = useState<PassiveIncomeReward[]>([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    if (!userId || pets.length === 0 || isCollecting) return;

    const checkPassiveIncome = async () => {
      try {
        setIsCollecting(true);
        const rewards = await PassiveIncomeService.collectPassiveIncome(userId, pets);

        if (rewards.length > 0) {
          setPassiveRewards(rewards);
          setShowRewardModal(true);
        }
      } catch (error) {
        console.error('Error collecting passive income:', error);
      } finally {
        setIsCollecting(false);
      }
    };

    checkPassiveIncome();

    const interval = setInterval(() => {
      checkPassiveIncome();
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, pets.length]);

  const closeModal = () => {
    setShowRewardModal(false);
    setPassiveRewards([]);
  };

  return {
    passiveRewards,
    showRewardModal,
    closeModal
  };
};
