import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetLoginInfo } from '../../lib';
import { RouteNamesEnum } from '../../localConstants';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useGetLoginInfo();

  if (!isLoggedIn) return null;

  const navItems = [
    {
      path: RouteNamesEnum.home,
      icon: '🏠',
      label: 'Home'
    },
    {
      path: RouteNamesEnum.mining,
      icon: '⛏️',
      label: 'Mining'
    },
    {
      path: RouteNamesEnum.ships,
      icon: '🚀',
      label: 'Ships'
    },
    {
      path: RouteNamesEnum.game,
      icon: '🎮',
      label: 'Game'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 mobile-nav md:hidden z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center py-2 px-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] ${
              location.pathname === item.path
                ? 'text-primary-600 bg-primary-100'
                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
            }`}
          >
            <span className="text-lg md:text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium font-inter">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};