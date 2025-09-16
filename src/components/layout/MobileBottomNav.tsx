import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, Rocket, Target, User, ShoppingCart, Users, Trophy } from 'lucide-react';
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
              className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200"
            >
              {icon}
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200"
            >
                <span className="text-gray-400">ZEND</span>
              <Zap size={24} className="-rotate-[50deg] scale-x-[-1]" />
            </button>
          )}
          <span className="text-xs text-gray-400 font-medium font-orbitron">
            {isLoggedIn ? label : 'Connect'}
          </span>
        </div>
      );
    }

    const content = (
      <div className="flex flex-col items-center flex-1 space-y-1 transition-all duration-200 hover:-translate-y-0.5">
        <div className={`p-2 rounded-xl transition-all duration-200 ${
          active ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400' : 'text-gray-500'
        }`}>
          {icon}
        </div>
        <span className={`text-xs font-medium font-orbitron ${
          active ? 'text-cyan-400 font-bold' : 'text-gray-500'
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
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-cyan-500/20 py-2 px-4 z-[9999] block md:hidden shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavItem
          to="/"
          icon={<Home size={20} />}
          label="Home"
        />
        
        <NavItem
          to="/ships"
          icon={<Rocket size={20} />}
          label="Ships"
        />
        
        <NavItem
          icon={<Zap size={24} />}
          label="Mine"
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