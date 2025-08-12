import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, Settings, LogOut, Menu as MenuIcon, Bell, Briefcase, Plus, Coins, X, Wallet, FileSearch, Gift } from 'lucide-react';
import { Button } from 'components';
import { NotificationsDropdown } from '../NotificationsMenu';
import { useGetIsLoggedIn, getAccountProvider, UnlockPanelManager } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useNotifications, Notification as CustomNotification } from '../../hooks/useNotifications';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAuth } from '../../context/AuthContext';

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user, logout: authLogout, forceReconnect } = useAuth();
  const { data: notifications, isLoading, error } = useNotifications(user?.id);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  // Debug logging for notifications
  useEffect(() => {
    console.log('🔔 Header: Notifications state:', {
      isLoggedIn,
      userId: user?.id,
      notificationsCount: notifications?.length || 0,
      unreadCount,
      notifications: notifications?.slice(0, 3),
      hasUser: !!user,
      userReady: !!user?.id,
    });
  }, [notifications, unreadCount, isLoggedIn, user?.id]);

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
    console.log('Connect button clicked!');
    console.log('Current isLoggedIn:', isLoggedIn);
    console.log('Navigating to /unlock...');
    try {
      navigate('/unlock');
      console.log('Navigation completed');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/unlock';
    }
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

  return (
    <div className="relative">
      {/* Main Header */}
      <header className="bg-white py-3 md:py-4 border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="h-8 md:h-10 w-8 md:w-10 flex items-center hover:scale-105 transition-transform"
                aria-label="Home"
              >
                <img
                  src="https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png"
                  alt="IDEA Logo"
                  className="w-full h-full object-contain"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                <Link
                  to="/gigs"
                  className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Browse Gigs
                </Link>
                <Link
                  to="/requests"
                  className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Open Bids
                </Link>
                <Link
                  to="/token-sale"
                  className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Coins size={16} />
                  Token Sale
                </Link>
                <Link
                  to="/rewards"
                  className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                >
                  <Gift size={16} />
                  Rewards
                </Link>
                {isLoggedIn && (
                  <>
                    <Link
                      to="/my-requests"
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                    >
                      <Briefcase size={16} />
                      My Requests
                    </Link>
                    <Link
                      to="/create-gig"
                      className="text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                    >
                      <Plus size={16} />
                      Create Gig
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Desktop and Mobile Actions */}
            <div className="flex items-center space-x-3">
              {/* Desktop Actions */}
              <div className="hidden lg:flex items-center space-x-3">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="max-w-xs hidden xl:block">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search gigs or bids..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all duration-200"
                      aria-label="Search gigs or bids"
                    />
                  </div>
                </form>

                {isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    {/* Notifications Button */}
                    <button
                      onClick={() => setShowNotificationsModal(true)}
                      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                      aria-label="Notifications"
                    >
                      <Bell size={20} className="text-gray-600 hover:text-indigo-600 transition-colors" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg border-2 border-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Profile Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="w-10 h-10 rounded-full overflow-hidden relative hover:scale-105 transition-all duration-200 ring-2 ring-transparent hover:ring-indigo-200 focus:ring-indigo-300"
                        aria-label="Profile menu"
                      >
                        {user?.avatar_url ? (
                          <>
                            <img
                              src={user.avatar_url}
                              alt={user.username || 'Profile'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }
                              }}
                            />
                            <div
                              className="fallback-avatar w-full h-full bg-gray-500 flex items-center justify-center text-xs text-white absolute inset-0"
                              style={{ display: 'none' }}
                            >
                              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </button>

                      {/* Desktop Profile Dropdown */}
                      {isProfileMenuOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsProfileMenuOpen(false)}
                            aria-hidden="true"
                          />
                          
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform -translate-x-8">
                            {/* User Info Header */}
                            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-500 to-purple-600">
                                  {user?.avatar_url ? (
                                    <>
                                      <img
                                        src={user.avatar_url}
                                        alt={user.username || 'Profile'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div
                                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white absolute inset-0"
                                        style={{ display: 'none' }}
                                      >
                                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 font-semibold truncate">
                                    {user?.full_name || user?.username || 'User'}
                                  </p>
                                  <p className="text-gray-500 text-sm truncate">
                                    {user?.wallet_address ? 
                                      `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : 
                                      'Wallet connected'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-2">
                              <Link
                                to="/profile"
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 group"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                  <User size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-medium">My Profile</p>
                                  <p className="text-xs text-gray-500">View and edit profile</p>
                                </div>
                              </Link>
                              
                              <Link
                                to="/my-requests"
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                  <Briefcase size={16} className="text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">My Requests</p>
                                  <p className="text-xs text-gray-500">Manage orders & proposals</p>
                                </div>
                              </Link>
                              
                              <Link
                                to="/create-gig"
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                  <Plus size={16} className="text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Create Gig</p>
                                  <p className="text-xs text-gray-500">Offer your services</p>
                                </div>
                              </Link>
                              
                              <a
                                href="https://ideagigs.store/token-sale"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-200 group"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                                  <Coins size={16} className="text-yellow-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Token Sale</p>
                                  <p className="text-xs text-gray-500">Buy IDA tokens</p>
                                </div>
                              </a>
                              
                              <div className="border-t border-gray-100 my-2"></div>
                              
                              <Link
                                to="/profile?tab=settings"
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                  <Settings size={16} className="text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Settings</p>
                                  <p className="text-xs text-gray-500">Account preferences</p>
                                </div>
                              </Link>
                              
                              <button
                                onClick={handleForceReconnect}
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 w-full text-left group"
                              >
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                  <Wallet size={16} className="text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Reconnect Wallet</p>
                                  <p className="text-xs text-gray-500">Refresh connection</p>
                                </div>
                              </button>
                              
                              <div className="border-t border-gray-100 my-2"></div>
                              
                              <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full text-left group"
                              >
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                  <LogOut size={16} className="text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium">Logout</p>
                                  <p className="text-xs text-gray-500">Disconnect wallet</p>
                                </div>
                              </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleConnect}
                    variant="outline"
                    size="md"
                    className="border-2 border-gray-800 text-gray-800 bg-white hover:bg-gray-50"
                  >
                    <Wallet size={16} />
                    Connect Wallet
                  </Button>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="flex lg:hidden items-center space-x-2">
                <button
                  onClick={handleSearchButtonClick}
                  className="p-2 text-gray-600 hover:text-indigo-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>

                {isLoggedIn && (
                  <button
                    onClick={() => setShowNotificationsModal(true)}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell size={20} className="text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-600 hover:text-indigo-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center z-50"
                  aria-label="Toggle menu"
                >
                  <MenuIcon size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
        
        {/* Menu Panel */}
        <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Menu Header */}
          <div className="bg-gradient-to-r from-indigo-50 to-pink-50 p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Menu Content */}
          <div className="p-4 space-y-2 overflow-y-auto h-full pb-20">
            {/* Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/gigs"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Briefcase size={18} />
                Browse Gigs
              </Link>
              <Link
                to="/requests"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileSearch size={18} />
                Open Bids
              </Link>
              <Link
                to="/token-sale"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Coins size={18} />
                Token Sale
              </Link>
              <Link
                to="/rewards"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Gift size={18} />
                Rewards
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link
                    to="/my-requests"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Briefcase size={18} />
                    My Requests
                  </Link>
                  <Link
                    to="/create-gig"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus size={18} />
                    Create Gig
                  </Link>
                </>
              )}
              
              <button
                onClick={() => {
                  handleSearchButtonClick();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
              >
                <Search size={18} />
                Search
              </button>
            </div>

            {/* User Section */}
            {isLoggedIn ? (
              <div className="pt-4 border-t border-gray-200 mt-4 space-y-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User size={18} />
                  Profile
                </Link>
                <Link
                  to="/profile?tab=settings"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings size={18} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleForceReconnect();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 px-3 text-base text-orange-600 hover:bg-orange-50 rounded-lg transition-colors w-full text-left"
                >
                  <Wallet size={18} />
                  Reconnect Wallet
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 py-3 px-3 text-base text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut size={18} />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 mt-4">
                <Button
                  onClick={() => {
                    handleConnect();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  fullWidth
                >
                  <Wallet size={18} />
                  Connect Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowNotificationsModal(false)}
            aria-hidden="true"
          />
          <div className="absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-pink-50 p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
                  aria-label="Close notifications"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <NotificationsDropdown
                notifications={notifications}
                isLoading={isLoading}
                error={error}
                onClose={() => setShowNotificationsModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};