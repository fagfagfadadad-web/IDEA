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
    <div className="bg-slate-900/95 backdrop-blur-lg py-3 md:py-4 border-b border-cyan-500/20 shadow-lg">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🐕</span>
              </div>
              <span className="text-2xl font-fredoka font-black gradient-text">
                ZenDOG
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link to="/mining" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Feed Dogs
              </Link>
              <Link to="/ships" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Dogs
              </Link>
              <Link to="/shop" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Pet Store
              </Link>
              <Link to="/tasks" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Tasks
              </Link>
              <Link to="/game" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Mini Game
              </Link>
              <Link to="/referrals" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Friends
              </Link>
              <Link to="/leaderboard" className="text-tamagochi-text-dark hover:text-tamagochi-500 transition-colors font-semibold font-nunito">
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* ZEN Balance */}
            {isLoggedIn && gameStats && (
              <div className="hidden md:flex food-points">
                <span className="text-pink-500">🍖</span>
                <span className="font-fredoka font-bold">
                  {gameStats.zenBalance?.toLocaleString() || '0'}
                </span>
                <span className="text-tamagochi-text-light text-sm font-nunito">Food</span>
              </div>
            )}

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-3">
                  {/* Profile Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="w-10 h-10 rounded-full overflow-hidden relative hover:scale-105 transition-all duration-200 border-2 border-pink-400/50"
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username || "Profile"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
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
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-pink-300/40 rounded-lg shadow-xl z-20 overflow-hidden">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-pink-100 hover:text-pink-600 transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <User size={16} />
                            Profile
                          </Link>
                          <Link
                            to="/mining"
                            className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-pink-100 hover:text-pink-600 transition-all duration-200"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <span>🍖</span>
                            Feed Dogs
                          </Link>
                          {user?.isAdmin && (
                            <Link
                              to="/admin"
                              className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <Settings size={16} />
                              Admin Panel
                            </Link>
                          )}
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-all duration-200 w-full text-left"
                          >
                            <LogOut size={16} />
                            Disconnect
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnect}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-bold"
                >
                  <Wallet size={16} />
                  Connect Wallet
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center space-x-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 border-l border-pink-300/40">
            <div className="p-4 border-b border-pink-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-pink-600">ZenDOG</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {/* ZEN Balance */}
              {isLoggedIn && gameStats && (
                <div className="bg-pink-50 p-4 rounded-lg border border-pink-300/40 mb-4">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-pink-500 text-xl">🍖</span>
                    <span className="text-pink-600 font-bold text-lg">
                      {gameStats.zenBalance?.toLocaleString() || '0'}
                    </span>
                    <span className="text-gray-600">Food</span>
                  </div>
                </div>
              )}

              <Link
                to="/mining"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-xl">🍖</span>
                Feed Dogs
              </Link>
              <Link
                to="/ships"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-xl">🐕</span>
                Dogs
              </Link>
              <Link
                to="/shop"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ShoppingCart size={18} />
                Pet Store
              </Link>
              <Link
                to="/tasks"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Target size={18} />
                Tasks
              </Link>
              <Link
                to="/game"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-xl">🎮</span>
                Mini Game
              </Link>
              <Link
                to="/referrals"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users size={18} />
                Friends
              </Link>
              <Link
                to="/leaderboard"
                className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trophy size={18} />
                Leaderboard
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-pink-100 hover:text-pink-600 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                  {user?.isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 py-3 px-3 text-base text-gray-700 hover:bg-purple-100 hover:text-purple-600 rounded-lg transition-all duration-200"
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
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-bold w-full mt-4"
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
  );
};