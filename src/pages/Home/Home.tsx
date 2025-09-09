import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import {
  Rocket,
  Zap,
  Trophy,
  Users,
  ArrowRight,
  Star,
  Coins,
  Pickaxe,
  Cpu,
  Shield,
  Target
} from "lucide-react";

export const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { gameStats, ships, isLoading } = useGame();
  const [animatedStats, setAnimatedStats] = useState({ zen: 0, mined: 0 });

  // Animate numbers
  useEffect(() => {
    console.log('🏠 Home: gameStats changed:', gameStats);
    if (gameStats) {
      const zenTarget = gameStats.zenBalance || 0;
      const minedTarget = gameStats.totalMined || 0;
      
      console.log('🏠 Home: Animation targets - ZEN:', zenTarget, 'Mined:', minedTarget);
      
      const duration = 1000;
      const steps = 60;
      const zenStep = zenTarget / steps;
      const minedStep = minedTarget / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedStats({
          zen: Math.floor(zenStep * currentStep),
          mined: Math.floor(minedStep * currentStep)
        });
        
        if (currentStep >= steps) {
          clearInterval(interval);
          setAnimatedStats({ zen: zenTarget, mined: minedTarget });
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [gameStats]);

  const features = [
    {
      icon: <Pickaxe size={32} className="text-cyan-400" />,
      title: "Mine ZEN Tokens",
      description: "Deploy your ships to mine valuable ZEN tokens across the galaxy"
    },
    {
      icon: <Rocket size={32} className="text-purple-400" />,
      title: "Upgrade Ships",
      description: "Enhance your mining fleet with powerful upgrades and new technologies"
    },
    {
      icon: <Users size={32} className="text-green-400" />,
      title: "Referral Program",
      description: "Invite friends and earn bonus ZEN tokens from their mining activities"
    },
    {
      icon: <Target size={32} className="text-orange-400" />,
      title: "Complete Tasks",
      description: "Finish daily and weekly challenges to earn extra rewards"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="space-y-8">
            {/* Logo and Title */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                  <Zap size={48} className="text-white" />
                </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-orbitron font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                ZEN
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 font-medium">
                Space Mining Adventure
              </p>
            </div>

            {/* Stats Display for Logged In Users */}
            {isLoggedIn && gameStats && (
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/20 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-orbitron font-bold text-cyan-400">
                      {gameStats.zenBalance?.toLocaleString() || '0'}
                    </div>
                    <div className="text-gray-400 text-sm">ZEN Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-orbitron font-bold text-purple-400">
                      {gameStats.totalMined?.toLocaleString() || '0'}
                    </div>
                    <div className="text-gray-400 text-sm">Total Mined</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-orbitron font-bold text-green-400">
                      {gameStats.miningLevel || 1}
                    </div>
                    <div className="text-gray-400 text-sm">Mining Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-orbitron font-bold text-orange-400">
                      {ships.length}
                    </div>
                    <div className="text-gray-400 text-sm">Ships</div>
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
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Pickaxe size={20} />
                    Start Mining
                    <ArrowRight size={20} />
                  </Button>
                  <Button
                    onClick={() => navigate(RouteNamesEnum.ships)}
                    variant="outline"
                    className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-slate-900 px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    <Rocket size={20} />
                    Manage Fleet
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate(RouteNamesEnum.unlock)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Zap size={20} />
                  Connect Wallet & Start Mining
                  <ArrowRight size={20} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-orbitron font-bold text-white mb-4">
              Game Features
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Explore the universe, mine precious ZEN tokens, and build the ultimate mining empire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-orbitron font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions for Logged In Users */}
        {isLoggedIn && (
          <div className="container mx-auto px-6 py-12">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/20">
              <h2 className="text-3xl font-orbitron font-bold text-white mb-8 text-center">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => navigate(RouteNamesEnum.mining)}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <Pickaxe size={24} />
                  <span className="font-orbitron">Mine</span>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.ships)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <Rocket size={24} />
                  <span className="font-orbitron">Ships</span>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.tasks)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <Target size={24} />
                  <span className="font-orbitron">Tasks</span>
                </Button>
                <Button
                  onClick={() => navigate(RouteNamesEnum.referrals)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-4 rounded-xl flex flex-col items-center gap-2"
                >
                  <Users size={24} />
                  <span className="font-orbitron">Referrals</span>
                </Button>
              </div>
            </div>
          </div>
        )}
            <h1 className="text-6xl md:text-8xl font-orbitron font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              ZEND
            </h1>
        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};