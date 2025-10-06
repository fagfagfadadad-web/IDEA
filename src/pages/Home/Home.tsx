import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { AnimatedDog } from '../../components/AnimatedDog';
import {
  ArrowRight,
  Heart,
  Star,
  Gift
} from "lucide-react";

export const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { gameStats, ships, isLoading } = useGame();
  const [animatedStats, setAnimatedStats] = useState({ food: 0, love: 0 });

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
      icon: <span className="text-3xl">🍖</span>,
      title: "Feed Your Dogs",
      description: "Give your dogs delicious food to keep them happy and healthy"
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
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-40 h-40">
                  <AnimatedDog />
                </div>
              </div>
              <h1 className="title-responsive font-fredoka font-bold gradient-text -mt-2">
                PupFi
              </h1>
              <p className="subtitle-responsive text-gray-700 font-inter font-semibold">
                Virtual Pet Care Game
              </p>
            </div>

            {/* Stats Display for Logged In Users */}
            {isLoggedIn && gameStats && (
              <div className="cute-card p-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="stat-card">
                    <div className="stat-value">
                      {gameStats.zenBalance?.toLocaleString() || '0'}
                    </div>
                    <div className="stat-label">🍖 Food</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {gameStats.totalMined?.toLocaleString() || '0'}
                    </div>
                    <div className="stat-label">❤️ Love</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {gameStats.miningLevel || 1}
                    </div>
                    <div className="stat-label">🏆 Level</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {ships.length}
                    </div>
                    <div className="stat-label">🐕 Dogs</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:gap-4 justify-center items-center px-4">
              {isLoggedIn ? (
                <>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.mining)}
                    className="cute-button w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                  >
                    <span className="text-xl">🍖</span>
                    Feed Your Dogs
                    <ArrowRight size={20} />
                  </Button>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.ships)}
                    className="cute-button-outline w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3"
                  >
                    <span className="text-xl">🐕</span>
                    My Dogs
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
                  Connect Wallet & Adopt Dog
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
              Take care of your virtual dogs, feed them, play with them, and watch them grow happy!
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

        {/* Quick Actions for Logged In Users */}
        {isLoggedIn && gameStats && (
          <div className="container mx-auto px-6 py-12">
            <div className="cute-card p-8">
              <h2 className="text-3xl font-inter font-bold text-gray-800 mb-8 text-center">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate(RouteNamesEnum.mining)}
                  className="cute-button p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🍖</span>
                  <span className="font-inter font-bold">Feed</span>
                  <div className="text-white/80 text-sm font-inter">
                    {gameStats.zenBalance?.toLocaleString() || '0'} 🍖
                  </div>
                  <div className="text-white/80 text-sm font-inter">Food</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.ships)}
                  className="cute-button-secondary p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🐕</span>
                  <span className="font-inter font-bold">Dogs</span>
                  <div className="text-white/80 text-sm font-inter">{ships.length} 🐕</div>
                  <div className="text-white/80 text-sm font-inter">Dogs</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.tasks)}
                  className="cute-button p-4 flex flex-col items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--tamagochi-green), #10b981)' }}
                >
                  <span className="text-2xl">🎯</span>
                  <span className="font-inter font-bold">Tasks</span>
                  <div className="text-white/80 text-sm font-inter">
                    {gameStats.miningLevel || 1} 🌟
                  </div>
                  <div className="text-white/80 text-sm font-inter">Level</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.referrals)}
                  className="cute-button p-4 flex flex-col items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--tamagochi-orange), var(--tamagochi-yellow))' }}
                >
                  <span className="text-2xl">👥</span>
                  <span className="font-inter font-bold">Friends</span>
                  <div className="text-white/80 text-sm font-inter">
                    {gameStats.totalReferrals || 0} 👥
                  </div>
                  <div className="text-white/80 text-sm font-inter">Friends</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.game)}
                  className="cute-button-secondary p-4 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🎮</span>
                  <span className="font-inter font-bold">Game</span>
                  <div className="text-white/80 text-sm font-inter">Play & Earn</div>
                  <div className="text-white/80 text-sm font-inter">Food</div>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};