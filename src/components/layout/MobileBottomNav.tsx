import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetLoginInfo } from '@multiversx/sdk-dapp/hooks';
import { routeNames } from '../../localConstants';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useGetLoginInfo();

  if (!isLoggedIn) return null;

  const navItems = [
    {
      path: routeNames.home,
      icon: '🏠',
      label: 'Home'
    },
    {
      path: routeNames.mining,
      icon: '⛏️',
      label: 'Mining'
    },
    {
      path: routeNames.ships,
      icon: '🚀',
      label: 'Ships'
    },
    {
      path: routeNames.game,
      icon: '🎮',
      label: 'Game'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};