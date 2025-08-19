import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, X, Layers, Code, Eye, Settings } from 'lucide-react';
import { Button } from 'components';
import { WalletConnect } from '../../WalletConnect';
import { useWindowSize } from '../../../hooks/useWindowSize';

export const Header = () => {
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
      {/* Main Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm py-4 border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="flex items-center gap-3 hover:scale-105 transition-transform"
                aria-label="Home"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Layers size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">MX Builder</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-6">
                <Link
                  to="/builder"
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2"
                >
                  <Code size={16} />
                  Builder
                </Link>
                <Link
                  to="/preview/demo"
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2"
                >
                  <Eye size={16} />
                  Demo
                </Link>
                <a
                  href="https://docs.multiversx.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  Docs
                </a>
              </nav>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <WalletConnect />
              <Button
                onClick={() => navigate('/builder')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Start Building
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                <MenuIcon size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
        
        {/* Menu Panel */}
        <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Menu Header */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-white/10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Layers size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">MX Builder</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Menu Content */}
          <div className="p-4 space-y-2">
            <Link
              to="/builder"
              className="flex items-center gap-3 py-3 px-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Code size={18} />
              Builder
            </Link>
            
            <Link
              to="/preview/demo"
              className="flex items-center gap-3 py-3 px-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Eye size={18} />
              Demo
            </Link>
            
            <a
              href="https://docs.multiversx.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-3 px-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings size={18} />
              Documentation
            </a>

            <div className="border-t border-white/10 my-4 pt-4">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};