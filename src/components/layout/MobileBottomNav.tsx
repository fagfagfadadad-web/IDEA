import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, User, Grid3X3, LogOut, Settings, Wallet, FileText, Briefcase } from 'lucide-react';
import { Button } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleConnect = () => {
    navigate('/unlock');
  };

  const NavItem = ({ to, icon, label, isCenter = false, isProfile = false, onClick }: {
    to?: string;
    icon: React.ReactNode;
    label: string;
    isCenter?: boolean;
    isProfile?: boolean;
    onClick?: () => void;
  }) => {
    const active = to ? isActive(to) : false;
    
    if (isCenter) {
      return (
        <div className="flex flex-col items-center flex-1 space-y-1">
          {isLoggedIn ? (
            <Link
              to="/create-gig"
              className="w-14 h-14 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200"
            >
              {icon}
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              className="w-14 h-14 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Wallet size={24} />
            </button>
          )}
          <span className="text-xs text-gray-600 font-medium">
            {isLoggedIn ? label : 'Connect'}
          </span>
        </div>
      );
    }

    if (isProfile) {
      return (
        <div className="flex flex-col items-center flex-1 space-y-1 relative group">
          <div className={`p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 ${
            active ? 'bg-gradient-to-r from-indigo-100 to-pink-100 text-indigo-600' : 'text-gray-500'
          }`}>
            <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-500 to-purple-600">
              {(user?.avatar_url && user.avatar_url.length > 0) ? (
                <>
                  <img
                    src={user.avatar_url}
                    alt={user.username || "Profile"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold absolute inset-0"
                    style={{ display: 'none' }}
                  >
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
                    src={user.avatar_url}
                    alt={user.username || "Profile"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold absolute inset-0"
                    style={{ display: 'none' }}
                  >
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
          </div>
          <span className={`text-xs font-medium ${
            active ? 'text-indigo-600 font-bold' : 'text-gray-500'
          }`}>
            {label}
          </span>
          
          {/* Dropdown menu for profile */}
          <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-48 z-50">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-t-lg transition-all duration-200"
            >
              <User size={16} />
              Profile
            </Link>
            <Link
              to="/my-requests"
              className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
            >
              <Briefcase size={16} />
              My Requests
            </Link>
            <Link
              to="/documentation"
              className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
            >
              <FileText size={16} />
              Documentation
            </Link>
            <Link
              to="/profile?tab=settings"
              className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-b-lg w-full text-left transition-all duration-200"
            >
              <LogOut size={16} />
              Disconnect
            </button>
          </div>
        </div>
      );
    }

    const content = (
      <div 
        className={`flex flex-col items-center flex-1 space-y-1 transition-all duration-200 hover:-translate-y-0.5 ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        <div className={`p-2 rounded-xl transition-all duration-200 ${
          active ? 'bg-gradient-to-r from-indigo-100 to-pink-100 text-indigo-600' : 'text-gray-500'
        }`}>
          {icon}
        </div>
        <span className={`text-xs font-medium ${
          active ? 'text-indigo-600 font-bold' : 'text-gray-500'
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
    <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-lg border-t border-gray-200 py-2 px-4 z-[9999] block md:hidden shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <NavItem
          to="/"
          icon={<Home size={20} />}
          label="Home"
        />
        
        <NavItem
          to="/gigs"
          icon={<Grid3X3 size={20} />}
          label="Gigs"
        />
        
        <NavItem
          icon={<Plus size={24} />}
          label="Create"
          isCenter
        />
        
        <NavItem
          to="/requests"
          icon={<Briefcase size={20} />}
          label="Bids"
        />
        
        <NavItem
          to="/profile"
          icon={<User size={20} />}
          label="Profile"
          isProfile
        />
      </div>
    </div>
  );
};