import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Settings, LogOut, Menu as MenuIcon, X, Wallet, Rocket, Target, Users, ShoppingCart, Trophy, Twitter, Send } from 'lucide-react';
import { Button } from 'components';
import { useGetIsLoggedIn, getAccountProvider } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useWindowSize } from '../../../hooks/useWindowSize';
import { useAuth } from '../../../context/AuthContext';
import { useGame } from '../../../context/GameContext';

export const Header = () => {
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  const { gameStats } = useGame();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  console.log('🎯 Header render:', { isAuthenticated, hasUser: !!user, username: user?.username });

  const handleLogout = async () => {
    try {
      await authLogout();
      navigate(RouteNamesEnum.unlock);
    } catch (error) {
      console.error('Logout error:', error);
      navigate(RouteNamesEnum.unlock);
    }
    setIsProfileMenuOpen(false);
  };

  const handleConnect = () => {
    navigate('/unlock');
  };

  return (
    <div className="app-header py-2 md:py-4 border-b border-primary-300/40 shadow-lg relative z-50">
      <div className="container mx-auto px-3 md:px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/" className="flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform">
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                <img src='/PupFi.png' alt='PupFi' className='w-full h-auto object-contain' />
              </div>
              <span className="text-lg md:text-2xl font-inter font-black gradient-text">
                PupFi
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
                Games
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
            {/* Food Balance */}
            {isAuthenticated && gameStats && (
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
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {/* Profile Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="w-10 h-10 rounded-full overflow-hidden relative hover:scale-105 transition-all duration-200 border-2 border-primary-400/50 shadow-lg"
                    >
                      {user?.avatarUrl ? (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {user.avatarUrl}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                          {user?.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>
                    
                    {isProfileMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: '#7C3AED' }}>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <User size={16} />
                            Profile
                          </Link>
                          <Link
                            to="/mining"
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <span>🍖</span>
                            Feed Dogs
                          </Link>
                          <Link
                            to="/ships"
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <span>🐕</span>
                            My Dogs
                          </Link>
                          <Link
                            to="/tasks"
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-600 transition-all duration-200 font-medium"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Target size={16} />
                            Tasks
                          </Link>
                          {user?.isAdmin && (
                            <>
                              <div className="border-t border-primary-400/30 my-1"></div>
                              <Link
                                to="/admin"
                                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-primary-600 transition-all duration-200 font-medium"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                <Settings size={16} />
                                Admin Panel
                              </Link>
                            </>
                          )}
                          <div className="border-t border-primary-400/30 my-1"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-red-600 transition-all duration-200 w-full text-left font-medium"
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
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center relative z-50"
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && createPortal((
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div
              className="fixed top-0 right-0 h-screen w-80 max-w-[90vw] shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto"
              style={{ background: 'linear-gradient(180deg, #7C3AED 0%, #6b21a8 100%)' }}
            >
              <div className="p-4 border-b border-primary-400/30">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">PupFi Menu</h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-white hover:text-white/80 min-w-[44px] min-h-[44px] flex items-center justify-center relative z-10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2 pb-24">
                {/* Food Balance */}
                {isAuthenticated && gameStats && (
                  <div className="p-4 rounded-lg mb-4" style={{ background: '#FFA724' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-white text-xl">🍖</span>
                      <span className="text-white font-bold text-lg">
                        {gameStats.zenBalance?.toLocaleString() || '0'}
                      </span>
                      <span className="text-white">Food</span>
                    </div>
                  </div>
                )}

                <Link
                  to="/mining"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">🍖</span>
                  Feed Dogs
                </Link>
                <Link
                  to="/ships"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">🐕</span>
                  Dogs
                </Link>
                <Link
                  to="/shop"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart size={18} />
                  Pet Store
                </Link>
                <Link
                  to="/tasks"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Target size={18} />
                  Tasks
                </Link>
                <Link
                  to="/game"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl">🎮</span>
                  Games
                </Link>
                <Link
                  to="/referrals"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Users size={18} />
                  Friends
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Trophy size={18} />
                  Leaderboard
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                    {user?.isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-primary-600 rounded-lg transition-all duration-200 font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings size={18} />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 py-3 px-3 text-base text-white hover:bg-red-600 rounded-lg transition-all duration-200 w-full text-left mt-4 font-medium"
                    >
                      <LogOut size={18} />
                      Disconnect
                    </button>

                    {/* Social Media Icons */}
                    <div className="mt-6 pt-4 border-t border-white/20">
                      <p className="text-sm text-white/70 mb-3 px-3">Follow us</p>
                      <div className="flex gap-4 px-3">
                        <a
                          href="https://twitter.com/pupfi"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors"
                        >
                          <Twitter size={20} />
                        </a>
                        <a
                          href="https://t.me/pupfi"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors"
                        >
                          <Send size={20} />
                        </a>
                      </div>
                    </div>
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
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </>
        ), document.body)}
      </div>
    </div>
  );
};