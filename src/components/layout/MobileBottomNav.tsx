import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetLoginInfo } from '../../lib';
import { RouteNamesEnum } from '../../localConstants';
import { useGame } from '../../context/GameContext';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useGetLoginInfo();
  const { gameStats, ships } = useGame();

  if (!isLoggedIn) return null;

  const navItems = [
    {
      path: RouteNamesEnum.home,
      icon: '🏠',
      label: 'Home',
      color: 'from-blue-400 to-blue-600'
    },
    {
      path: RouteNamesEnum.mining,
      icon: '🍖',
      label: 'Feed',
      color: 'from-orange-400 to-orange-600',
      badge: gameStats?.zenBalance ? Math.min(gameStats.zenBalance, 999) : 0
    },
    {
      path: RouteNamesEnum.ships,
      icon: '🐕',
      label: 'Dogs',
      color: 'from-pink-400 to-pink-600',
      badge: ships.length
    },
    {
      path: RouteNamesEnum.tasks,
      icon: '🎯',
      label: 'Tasks',
      color: 'from-green-400 to-green-600'
    },
    {
      path: RouteNamesEnum.game,
      icon: '🎮',
      label: 'Game',
      color: 'from-purple-400 to-purple-600'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-[999999]" style={{ zIndex: '999999 !important' as any }}>
      {/* Gradient Background */}
      <div className="bg-gradient-to-t from-white via-white/95 to-white/80 backdrop-blur-xl border-t-2 border-primary-200/50 shadow-2xl">
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
                    : 'bg-primary-100 hover:bg-primary-200'
                  }
                  border-2 border-white shadow-md
                `}>
                  {/* Icon */}
                  <span className={`${isCenter ? 'text-2xl' : 'text-xl'}`}>
                    {item.icon}
                  </span>
                  
                  {/* Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full shadow-md"></div>
                  )}
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs font-inter font-bold mt-1 transition-colors duration-200
                  ${isActive ? 'text-primary-600' : 'text-gray-600'}
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
          <div className="w-8 h-1 bg-gradient-to-r from-primary-300 to-primary-500 rounded-full"></div>
        </div>
        
        {/* Paw Prints Decoration */}
        <div className="absolute top-1 left-4 text-primary-200 text-xs opacity-50">🐾</div>
        <div className="absolute top-1 right-4 text-primary-200 text-xs opacity-50">🐾</div>
      </div>
      
      {/* Safe Area for iPhone */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </div>
  );
};