import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, Settings, LogOut, Menu as MenuIcon, Bell, Briefcase, Plus, Coins, X, Wallet, FileSearch, Gift } from 'lucide-react';
import { Button } from 'components';
import { NotificationsDropdown } from '../NotificationsMenu';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useNotifications } from '../../hooks/useNotifications';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user, logout: authLogout, forceReconnect } = useAuth();
  const { data: notifications, isLoading, error } = useNotifications(user?.id);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await authLogout();
      navigate(RouteNamesEnum.home);
    } catch (error) {
      console.error('Logout error:', error);
      navigate(RouteNamesEnum.home);
    }
    setIsProfileMenuOpen(false);
  };

  const handleForceReconnect = async () => {
    try {
      await forceReconnect();
    } catch (error) {
      console.error('Force reconnect error:', error);
    }
    setIsProfileMenuOpen(false);
  };

  const handleConnect = () => {
    navigate('/unlock');
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    } else {
      navigate('/search');
    }
  };

  const handleSearchButtonClick = () => {
    navigate('/search');
  };

  // 🔹 Komponent pre avatar, aby bol kód na jednom mieste
  const AvatarCircle = ({ size = 40 }: { size?: number }) => (
    <div
      className={`rounded-full overflow-hidden relative flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold`}
      style={{ width: size, height: size }}
    >
      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
      {user?.avatar_url && (
        <img
          src={user.avatar_url}
          alt={user.username || 'Profile'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );

  return (
    <div className="relative">
      <header className="bg-white py-3 md:py-4 border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="h-8 md:h-10 w-8 md:w-10 flex items-center hover:scale-105 transition-transform">
                <img
                  src="https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png"
                  alt="IDEA Logo"
                  className="w-full h-full object-contain"
                />
              </Link>
              {/* Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                <Link to="/gigs" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg">Browse Gigs</Link>
                <Link to="/requests" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg">Open Bids</Link>
                <Link to="/token-sale" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg flex items-center gap-2">
                  <Coins size={16} /> Token Sale
                </Link>
                <Link to="/rewards" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-lg flex items-center gap-2">
                  <Gift size={16} /> Rewards
                </Link>
              </nav>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="hidden xl:block">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search gigs..."
                    className="pl-10 pr-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </form>

              {/* Notifications */}
              {isLoggedIn && (
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold border-2 border-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Avatar / Connect */}
              {isLoggedIn ? (
                <div className="relative">
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} aria-label="Profile menu">
                    <AvatarCircle size={40} />
                  </button>
                  {isProfileMenuOpen && (
                    <div className="fixed top-[70px] right-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[999]">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                        <AvatarCircle size={48} />
                        <div>
                          <p className="font-semibold">{user?.full_name || user?.username || 'User'}</p>
                          <p className="text-sm text-gray-500">
                            {user?.wallet_address
                              ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
                              : 'Wallet connected'}
                          </p>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link to="/profile" className="flex items-center gap-3 px-6 py-3 hover:bg-indigo-50">
                          <User size={16} /> My Profile
                        </Link>
                        <Link to="/profile?tab=settings" className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                          <Settings size={16} /> Settings
                        </Link>
                        <button onClick={handleForceReconnect} className="flex items-center gap-3 px-6 py-3 hover:bg-orange-50 w-full">
                          <Wallet size={16} /> Reconnect Wallet
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-3 hover:bg-red-50 w-full text-red-600">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={handleConnect} variant="outline" size="md">
                  <Wallet size={16} /> Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
