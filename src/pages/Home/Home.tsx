import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
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
          <p className="text-xl text-gray-700">Loading ZenDOG...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 font-inter">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-300/20 via-purple-300/20 to-yellow-300/20 animate-pulse"></div>
        {/* Floating hearts */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-pink-300 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              fontSize: `${12 + Math.random() * 8}px`
            }}
          >
            💖
          </div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="space-y-8">
            {/* Logo and Title */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                  <span className="text-4xl">🐕</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                ZenDOG
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 font-medium">
                Virtual Pet Care Game
              </p>
            </div>

            {/* Stats Display for Logged In Users */}
            {isLoggedIn && gameStats && (
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-pink-300/40 max-w-2xl mx-auto shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-pink-600">
                      {gameStats.zenBalance?.toLocaleString() || '0'}
                    </div>
                    <div className="text-gray-600 text-sm">🍖 Food Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-purple-600">
                      {gameStats.totalMined?.toLocaleString() || '0'}
                    </div>
                    <div className="text-gray-600 text-sm">❤️ Love Given</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-green-600">
                      {gameStats.miningLevel || 1}
                    </div>
                    <div className="text-gray-600 text-sm">🏆 Care Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-orange-600">
                      {ships.length}
                    </div>
                    <div className="text-gray-600 text-sm">🐕 Pet Dogs</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isLoggedIn ? (
                <>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.mining)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="text-xl">🍖</span>
                    Feed Your Dogs
                    <ArrowRight size={20} />
                  </Button>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.ships)}
                    variant="outline"
                    className="border-2 border-pink-400 text-pink-600 hover:bg-pink-400 hover:text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2"
                  >
                    <span className="text-xl">🐕</span>
                    My Dogs
                  </Button>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.game)}
                    variant="outline"
                    className="border-2 border-purple-400 text-purple-600 hover:bg-purple-400 hover:text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2"
                  >
                    <span className="text-xl">🎮</span>
                    Mini Game
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate(RouteNamesEnum.unlock)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
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
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Game Features
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Take care of your virtual dogs, feed them, play with them, and watch them grow happy!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-lg rounded-xl p-6 border border-pink-200/50 hover:border-pink-400/50 transition-all duration-300 hover:transform hover:scale-105 shadow-lg"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
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
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 border border-pink-300/40 shadow-lg">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate(RouteNamesEnum.mining)}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🍖</span>
                  <span className="font-bold">Feed</span>
                  <div className="text-pink-100 text-sm">
                    {gameStats.zenBalance?.toLocaleString() || '0'} 🍖
                  </div>
                  <div className="text-pink-100 text-sm">Food Points</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.ships)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🐕</span>
                  <span className="font-bold">Dogs</span>
                  <div className="text-purple-100 text-sm">{ships.length} 🐕</div>
                  <div className="text-purple-100 text-sm">Pet Dogs</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.tasks)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🎯</span>
                  <span className="font-bold">Tasks</span>
                  <div className="text-green-100 text-sm">
                    {gameStats.miningLevel || 1} 🌟
                  </div>
                  <div className="text-green-100 text-sm">Care Level</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.referrals)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">👥</span>
                  <span className="font-bold">Friends</span>
                  <div className="text-orange-100 text-sm">
                    {gameStats.totalReferrals || 0} 👥
                  </div>
                  <div className="text-orange-100 text-sm">Friends</div>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.game)}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">🎮</span>
                  <span className="font-bold">Game</span>
                  <div className="text-indigo-100 text-sm">Play & Earn</div>
                  <div className="text-indigo-100 text-sm">Food Points</div>
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