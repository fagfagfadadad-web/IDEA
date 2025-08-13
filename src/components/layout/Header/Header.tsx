import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, Settings, LogOut, Menu as MenuIcon, Bell, Briefcase, Plus, Coins, X, Wallet, FileSearch, Gift } from 'lucide-react';
import { Button } from 'components';
import { NotificationsDropdown } from '../../NotificationsMenu';
import { useGetIsLoggedIn, getAccountProvider, UnlockPanelManager } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useNotifications, Notification as CustomNotification } from '../../../hooks/useNotifications';
import { useWindowSize } from '../../../hooks/useWindowSize';
import { useAuth } from '../../../context/AuthContext';

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
    try {
      navigate('/unlock');
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
    <header className="bg-white py-3 md:py-4 border-b border-gray-200 shadow-sm sticky top-0 z-50">
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
                className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                Browse Gigs
              </Link>
              <Link
                to="/requests"
                className="text-gray-800 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                Open Bids
              </Link>
              <Link
                to="/token-sale"
                className="text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Coins size={16} />
                Token Sale
              </Link>
              <Link
                to="/rewards"
                className="text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Gift size={16} className="text-gray-400" />
                Rewards
              </Link>
              {isLoggedIn && (
                <>
                  <Link
                    to="/my-requests"
                    className="text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Briefcase size={16} />
                    My Requests
                  </Link>
                  <Link
                    to="/create-gig"
                    className="text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm font-medium"
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
                      className="w-8 h-8 rounded-full overflow-hidden relative hover:scale-105 transition-all duration-200"
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
                        <div className="w-full h-full bg-gray-500 flex items-center justify-center text-xs text-white">
                          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </button>

                    {isProfileMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsProfileMenuOpen(false)}
                          aria-hidden="true"
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-t-lg transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <User size={16} />
                            Profile
                          </Link>
                          <Link
                            to="/my-requests"
                            className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Briefcase size={16} />
                            My Requests
                          </Link>
                          <Link
                            to="/create-gig"
                            className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Plus size={16} />
                            Create Gig
                          </Link>
                          <a
                            href="https://ideagigs.store/token-sale"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Coins size={16} />
                            Token Sale
                          </a>
                          <Link
                            to="/profile?tab=settings"
                            className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Settings size={16} />
                            Settings
                          </Link>
                          <button
                            onClick={handleForceReconnect}
                            className="flex items-center gap-2 px-4 py-3 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-200 w-full text-left"
                          >
                            <Wallet size={16} />
                            Reconnect Wallet
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-b-lg w-full text-left transition-all duration-200"
                          >
                            <LogOut size={16} />
                            Logout
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
                onClick={() => {
                  console.log('Toggling mobile menu, current state:', isMobileMenuOpen);
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center block z-[60]"
                aria-label="Toggle menu"
              >
                <MenuIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-[60] transform transition-transform duration-300 translate-x-0">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold gradient-text">Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              <Link
                to="/gigs"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Briefcase size={18} />
                Browse Gigs
              </Link>
              <Link
                to="/requests"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileSearch size={18} />
                Open Bids
              </Link>
              <Link
                to="/token-sale"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Coins size={18} />
                Token Sale
              </Link>
              <Link
                to="/rewards"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Gift size={18} />
                Rewards
              </Link>
              {isLoggedIn && (
                <>
                  <Link
                    to="/my-requests"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Briefcase size={18} />
                    My Requests
                  </Link>
                  <Link
                    to="/create-gig"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
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
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200 w-full text-left"
              >
                <Search size={18} />
                Search
              </button>
              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                  <Link
                    to="/profile?tab=settings"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50 rounded-lg transition-all duration-200"
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
                    className="flex items-center gap-3 py-3 px-3 text-base text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 rounded-lg transition-all duration-200 w-full text-left"
                  >
                    <Wallet size={18} />
                    Reconnect Wallet
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-800 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-lg transition-all duration-200 w-full text-left mt-4"
                  >
                    <LogOut size={18} />
                    Disconnect
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    handleConnect();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  fullWidth
                  className="mt-4"
                >
                  <Wallet size={18} />
                  Connect Wallet
                </Button>
              )}
            </nav>
          </div>
        </>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotificationsModal(false)}
            aria-hidden="true"
          />
          <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-[60] max-h-[80vh] overflow-hidden">
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
        </>
      )}
    </header>
  );
};