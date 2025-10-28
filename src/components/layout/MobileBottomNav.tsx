import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RouteNamesEnum } from '../../localConstants';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { gameStats, ships } = useGame();

  if (!isAuthenticated) return null;

  // Hide in arena matches
  if (location.pathname.startsWith('/arena/match/')) return null;

  const navItems = [
    {
      path: RouteNamesEnum.home,
      icon: '🏠',
      label: 'Home',
      color: 'from-blue-400 to-blue-600'
    },
    {
      path: '/pets',
      icon: '🐕',
      label: 'Pets',
      color: 'from-amber-400 to-amber-600'
    },
    {
      path: '/inventory',
      icon: '🎒',
      label: 'Items',
      color: 'from-purple-400 to-purple-600'
    },
    {
      path: RouteNamesEnum.marketplace,
      icon: '🛒',
      label: 'Market',
      color: 'from-green-400 to-green-600'
    },
    {
      path: RouteNamesEnum.game,
      icon: '🎮',
      label: 'Games',
      color: 'from-cyan-400 to-cyan-600'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-[999999]" style={{ zIndex: '999999 !important' as any }}>
      {/* Gradient Background */}
      <div className="bg-gradient-to-t from-purple-500 via-purple-500/95 to-purple-500/90 backdrop-blur-xl border-t-2 border-purple-600/50 shadow-2xl">
        <div className="flex justify-around items-end py-2 px-2 relative">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isCenter = index === 2; // Dogs button in center
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                  isCenter 
                    ? 'transform -translate-y-4 p-3' 
                    : 'p-2'
                } ${
                  isActive 
                    ? 'scale-110' 
                    : 'hover:scale-105'
                }`}
              >
                {/* Button Background */}
                <div className={`
                  ${isCenter ? 'w-16 h-16' : 'w-12 h-12'}
                  rounded-full flex items-center justify-center relative
                  ${isActive
                    ? `bg-gradient-to-br ${item.color} shadow-lg`
                    : 'bg-purple-400 hover:bg-purple-300'
                  }
                  border-2 border-white shadow-md
                `}>
                  {/* Icon */}
                  {isCenter ? (
                    <img
                      src="/PupFi.png"
                      alt="PupFi Logo"
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <span className="text-xl">
                      {item.icon}
                    </span>
                  )}


                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full shadow-md"></div>
                  )}
                </div>

                {/* Label */}
                <span className={`
                  text-xs font-inter font-bold mt-1 transition-colors duration-200
                  ${isActive ? 'text-white' : 'text-white/80'}
                  ${isCenter ? 'text-sm' : ''}
                `}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-1 bg-gradient-to-r from-purple-300 to-purple-400 rounded-full"></div>
        </div>

        {/* Paw Prints Decoration */}
        <div className="absolute top-1 left-4 text-xs drop-shadow-md" style={{ filter: 'brightness(0) invert(1)' }}>🐾</div>
        <div className="absolute top-1 right-4 text-xs drop-shadow-md" style={{ filter: 'brightness(0) invert(1)' }}>🐾</div>
      </div>

      {/* Safe Area for iPhone */}
      <div className="h-safe-area-inset-bottom bg-purple-500"></div>
    </div>
  );
};