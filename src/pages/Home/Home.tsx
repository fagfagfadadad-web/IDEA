import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { RouteNamesEnum } from 'localConstants';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { AnimatedDog } from '../../components/AnimatedDog';
import {
  ArrowRight,
  Heart,
  Star,
  Gift,
  Clock
} from "lucide-react";

export const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { gameStats, ships, isLoading } = useGame();
  const [animatedStats, setAnimatedStats] = useState({ food: 0, love: 0 });
  const [autoFeederTimeRemaining, setAutoFeederTimeRemaining] = useState<string | null>(null);

  // Animate numbers
  useEffect(() => {
    console.log('🏠 Home: gameStats changed:', gameStats);
    if (gameStats) {
      const foodTarget = gameStats.zenBalance || 0;
      const loveTarget = gameStats.totalMined || 0;

      console.log('🏠 Home: Animation targets - Food:', foodTarget, 'Love:', loveTarget);

      const duration = 1000;
      const steps = 60;
      const foodStep = foodTarget / steps;
      const loveStep = loveTarget / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedStats({
          food: Math.floor(foodStep * currentStep),
          love: Math.floor(loveStep * currentStep)
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedStats({ food: foodTarget, love: loveTarget });
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }
  }, [gameStats]);

  // Auto-Feeder countdown timer
  useEffect(() => {
    if (!gameStats?.activeBoosts) return;

    const autoFeederBoost = gameStats.activeBoosts.find(boost => {
      if (boost.type !== 'autoFeeder') return false;
      const now = new Date();
      const expiresAt = boost.expiresAt?.toDate?.() || new Date(boost.expiresAt);
      return expiresAt > now;
    });

    if (!autoFeederBoost) {
      setAutoFeederTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = autoFeederBoost.expiresAt?.toDate?.() || new Date(autoFeederBoost.expiresAt);
      const diff = Math.max(0, expiresAt.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (diff <= 0) {
        setAutoFeederTimeRemaining(null);
      } else {
        setAutoFeederTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameStats?.activeBoosts]);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 font-inter flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-4 animate-bounce">
            <span className="text-3xl">🐕</span>
          </div>
          <p className="text-xl text-gray-700">Loading PupFi...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <span className="text-3xl">🐕</span>,
      title: "My Pets",
      description: "View and manage your pet collection, see their stats and happiness levels"
    },
    {
      icon: <span className="text-3xl">🎾</span>,
      title: "Play & Exercise",
      description: "Play games with your dogs to increase their happiness and earn rewards"
    },
    {
      icon: <span className="text-3xl">👥</span>,
      title: "Invite Friends",
      description: "Invite friends to play and earn bonus food points from their activities"
    },
    {
      icon: <span className="text-3xl">🏆</span>,
      title: "Complete Challenges",
      description: "Finish daily care tasks and challenges to earn extra food and toys"
    }
  ];

  return (
    <div className="relative">
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="space-y-8">
            {/* Logo and Title */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-full flex justify-center">
                <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center animate-float">
                  <img src='/pupfi new .png' alt='PupFi' className='w-full h-auto object-contain' />
                </div>
              </div>
              <h1 className="title-responsive font-fredoka font-bold gradient-text">
                PupFi
              </h1>
              <p className="subtitle-responsive text-gray-700 font-inter font-semibold">
                Feed. Play. Earn. The PupFi Way.
              </p>
            </div>

            {/* My Pets Overview */}
            {isAuthenticated && (
              <div className="cute-card p-6 max-w-2xl mx-auto">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🐕</div>
                  <h2 className="text-2xl font-inter font-bold text-gray-800">My Pet Collection</h2>
                  <p className="text-gray-600 font-inter">
                    You have <span className="font-bold text-primary-600">{ships.length}</span> {ships.length === 1 ? 'pet' : 'pets'} in your collection
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:gap-4 justify-center items-center px-4">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => navigate('/pets')}
                    className="cute-button w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                  >
                    <span className="text-xl">🐕</span>
                    My Pets
                    <ArrowRight size={20} />
                  </Button>
                  <Button
                    onClick={() => navigate('/market')}
                    className="cute-button-outline w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                  >
                    <span className="text-xl">🛒</span>
                    NFT Market
                  </Button>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.game)}
                    className="cute-button-secondary w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                  >
                    <span className="text-xl">🎮</span>
                    Mini Game
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate(RouteNamesEnum.unlock)}
                  className="cute-button w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                >
                  <span className="text-xl">🐕</span>
                  Start Taking Care of Your Pup
                  <ArrowRight size={20} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-inter font-bold text-gray-800 mb-4">
              Game Features
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto font-inter">
              Take care of your dogs, feed them, play with them, and watch them grow happy!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="cute-card p-6"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-inter font-bold text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed font-inter">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};