import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, Target, User, ShoppingCart, Users, Trophy } from 'lucide-react';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleConnect = () => {
    navigate('/unlock');
  };

  const NavItem = ({ to, icon, label, isCenter = false }: {
    to?: string;
    icon: React.ReactNode;
    label: string;
    isCenter?: boolean;
    onClick?: () => void;
  }) => {
    const active = to ? isActive(to) : false;
    
    if (isCenter) {
      return (
        <div className="flex flex-col items-center flex-1 space-y-1">
          {isLoggedIn ? (
            <Link
              to="/mining"
              className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200"
            >
              <span className="text-2xl">🍖</span>
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200"
            >
              <span className="text-2xl">🐕</span>
            </button>
          )}
          <span className="text-xs text-gray-400 font-medium">
            {isLoggedIn ? 'Feed' : 'Connect'}
          </span>
        </div>
      );
    }

    const content = (
      <div className="flex flex-col items-center flex-1 space-y-1 transition-all duration-200">
        <div className={`p-2 rounded-xl transition-all duration-200 ${
          active ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-500' : 'text-gray-500'
        }`}>
          {icon}
        </div>
        <span className={`text-xs font-medium ${
          active ? 'text-pink-500 font-bold' : 'text-gray-500'
        }`}>
          {label}
        </span>
      </div>
    );

    if (to) {
      return (
        <Link to={to} className="flex-1">
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-pink-300/40 py-2 px-4 z-[9999] block md:hidden shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavItem
          to="/"
          icon={<Home size={20} />}
          label="Home"
        />
        
        <NavItem
          to="/ships"
          icon={<span className="text-xl">🐕</span>}
          label="Dogs"
        />
        
        <NavItem
          icon={<Heart size={24} />}
          label="Feed"
          isCenter
        />
        
        <NavItem
          to="/tasks"
          icon={<Target size={20} />}
          label="Tasks"
        />
        
        <NavItem
          to="/profile"
          icon={<User size={20} />}
          label="Profile"
        />
      </div>
    </div>
  );
};