import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Settings, LogOut, Menu as MenuIcon, X, Wallet, Rocket, Target, Users, ShoppingCart, Trophy } from 'lucide-react';
import { Button } from 'components';
import { useGetIsLoggedIn, getAccountProvider } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { gameStats } = useGame();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const provider = getAccountProvider();
      await provider.logout();
      navigate(RouteNamesEnum.home);
    } catch (error) {
      console.error('Logout error:', error);
      navigate(RouteNamesEnum.home);
    }
    setIsProfileMenuOpen(false);
  };

  const handleConnect = () => {
    navigate('/unlock');
  };

  return (
    <div className="app-header py-2 md:py-4 border-b border-primary-300/40 shadow-lg">
      <div className="container mx-auto px-3 md:px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/" className="flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xl md:text-2xl">🐕</span>
              </div>
              <span className="text-lg md:text-2xl font-inter font-black gradient-text">
                ZenDOG
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              <Link to="/mining" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Feed Dogs
              </Link>
              <Link to="/ships" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Dogs
              </Link>
              <Link to="/shop" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Pet Store
              </Link>
              <Link to="/tasks" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Tasks
              </Link>
              <Link to="/game" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Mini Game
              </Link>
              <Link to="/referrals" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Friends
              </Link>
              <Link to="/leaderboard" className="text-gray-700 hover:text-primary-500 transition-colors font-semibold font-inter">
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* ZEN Balance */}
            {isLoggedIn && gameStats && (
              <div className="hidden md:flex food-points">
                <span className="text-primary-500">🍖</span>
                <span className="font-inter font-bold">
                  {gameStats.zenBalance?.toLocaleString() || '0'}
                </span>
                <span className="text-gray-600 text-sm font-inter">Food</span>
              </div>
            )}

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  {/* Profile Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="w-10 h-10 rounded-full overflow-hidden relative hover:scale-105 transition-all duration-200 border-2 border-primary-400/50 shadow-lg"
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                          {user?.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>
                    
                    {isProfileMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-lg border border-primary-300/40 rounded-xl shadow-2xl z-20 overflow-hidden">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-100 hover:text-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <User size={16} />
                            Profile
                          </Link>
                          <Link
                            to="/mining"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-100 hover:text-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <span>🍖</span>
                            Feed Dogs
                          </Link>
                          <Link
                            to="/ships"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-100 hover:text-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <span>🐕</span>
                            My Dogs
                          </Link>
                          <Link
                            to="/tasks"
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-100 hover:text-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Target size={16} />
                            Tasks
                          </Link>
                          {user?.isAdmin && (
                            <>
                              <div className="border-t border-gray-200 my-1"></div>
                              <Link
                                to="/admin"
                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-accent-100 hover:text-accent-600 transition-all duration-200 font-medium"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <Settings size={16} />
                                Admin Panel
                              </Link>
                            </>
                          )}
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full text-left font-medium"
                          >
                            <LogOut size={16} />
                            Disconnect Wallet
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnect}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg"
                >
                  <Wallet size={16} />
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
               className="fixed inset-0 bg-black bg-opacity-50 z-[9999998]"
               style={{ 
                 position: 'fixed !important' as any,
                 top: '0 !important' as any,
                 left: '0 !important' as any,
                 right: '0 !important' as any,
                 bottom: '0 !important' as any,
                 zIndex: '9999998 !important' as any
               }}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-primary-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
               className="fixed top-0 right-0 h-screen w-80 max-w-[90vw] bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 border-l border-primary-300/40 z-[9999999]"
               style={{ 
                 position: 'fixed !important' as any,
                 top: '0 !important' as any,
                 right: '0 !important' as any,
                 height: '100vh !important' as any,
                 width: '320px !important' as any,
                 zIndex: '9999999 !important' as any,
                 background: 'rgba(255, 255, 255, 0.95) !important' as any,
                 backdropFilter: 'blur(20px) !important' as any
               }}
              >
                <MenuIcon size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <>
            <div 
             className="mobile-menu-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div 
             className="mobile-menu-drawer shadow-xl transform transition-transform duration-300 border-l border-primary-300/40"
            >
              <div className="p-4 border-b border-primary-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-primary-600">ZenDOG Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    style={{ zIndex: 1000004 }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {/* ZEN Balance */}
                {isLoggedIn && gameStats && (
                  <div className="bg-primary-50 p-4 rounded-lg border border-primary-300/40 mb-4">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-primary-500 text-xl">🍖</span>
                      <span className="text-primary-600 font-bold text-lg">
                        {gameStats.zenBalance?.toLocaleString() || '0'}
                      </span>
                      <span className="text-gray-600">Food</span>
                    </div>
                  </div>
                )}

                <Link
                  to="/mining"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">🍖</span>
                  Feed Dogs
                </Link>
                <Link
                  to="/ships"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">🐕</span>
                  Dogs
                </Link>
                <Link
                  to="/shop"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart size={18} />
                  Pet Store
                </Link>
                <Link
                  to="/tasks"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Target size={18} />
                  Tasks
                </Link>
                <Link
                  to="/game"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">🎮</span>
                  Mini Game
                </Link>
                <Link
                  to="/referrals"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Users size={18} />
                  Friends
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Trophy size={18} />
                  Leaderboard
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-primary-100 hover:text-primary-600 rounded-lg transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                    {user?.isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-accent-100 hover:text-accent-600 rounded-lg transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings size={18} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                      className="p-2 text-gray-600 hover:text-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center z-[9999999]"
                      style={{ 
                        zIndex: '9999999 !important' as any,
                        position: 'relative !important' as any
                      }}
                      }}
                      className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all duration-200 w-full text-left mt-4"
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
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg font-bold w-full mt-4"
                  >
                    <Wallet size={18} />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};