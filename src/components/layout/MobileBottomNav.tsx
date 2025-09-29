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
        <div className="flex flex-col items-center flex-1 space-y-1 mobile-nav-item">
          {isLoggedIn ? (
            <Link
              to="/mining"
              className="mobile-nav-center text-white hover:scale-110 transition-all duration-300"
            >
              <span>🍖</span>
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              className="mobile-nav-center text-white hover:scale-110 transition-all duration-300"
            >
              <span>🐕</span>
            </button>
          )}
          <span className="text-xs text-tamagochi-text-light font-nunito font-medium">
            {isLoggedIn ? 'Feed' : 'Connect'}
          </span>
        </div>
      );
    }

    const content = (
      <div className={`mobile-nav-item flex-1 ${active ? 'active' : ''}`}>
        <div className={`p-2 rounded-xl transition-all duration-200 ${
          active ? 'text-tamagochi-500' : 'text-tamagochi-text-light'
        }`}>
          {icon}
        </div>
        <span className={`text-xs font-nunito font-medium ${
          active ? 'text-tamagochi-500 font-bold' : 'text-tamagochi-text-light'
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
    <div className="mobile-nav fixed bottom-0 left-0 right-0 py-2 px-4 z-[9999] block md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavItem
          to="/"
          icon={<Home size={20} />}
          label="Home"
        />
        
        <NavItem
          to="/ships"
          icon={<span className="text-2xl">🐕</span>}
          label="Dogs"
        />
        
        <NavItem
          icon={<span className="text-3xl">🍖</span>}
          label="Feed"
          isCenter
        />
        
        <NavItem
          to="/tasks"
          icon={<Target size={20} />}
          label="Tasks"
        />
        
        <NavItem
          to="/game"
          icon={<span className="text-2xl">🎮</span>}
          label="Game"
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