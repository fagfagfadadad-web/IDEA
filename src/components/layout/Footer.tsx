import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <div className="app-footer py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                <span className="text-2xl">🐕</span>
              </div>
              <span className="text-2xl font-inter font-black gradient-text">
                ZenDOG
              </span>
            </div>
            <p className="text-gray-600 max-w-xs text-center md:text-left font-inter">
              The ultimate virtual pet care experience on MultiversX blockchain
            </p>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center md:items-start space-y-3">
              <h3 className="font-inter font-bold text-gray-800">Game</h3>
              <Link 
                to="/mining" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Feed Dogs
              </Link>
              <Link 
                to="/ships" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Dogs
              </Link>
              <Link 
                to="/shop" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Pet Store
              </Link>
              <Link 
                to="/leaderboard" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Leaderboard
              </Link>
            </div>

            <div className="flex flex-col items-center md:items-start space-y-3">
              <h3 className="font-inter font-bold text-gray-800">Community</h3>
              <Link 
                to="/tasks" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Tasks
              </Link>
              <Link 
                to="/referrals" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Referrals
              </Link>
              <a 
                href="#" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Discord
              </a>
              <a 
                href="#" 
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200 font-inter"
              >
                Telegram
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="font-inter font-bold text-gray-800">Connect</h3>
            <div className="flex items-center justify-center md:justify-start space-x-4">
              <a 
                href="#"
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#"
                className="text-gray-600 hover:text-primary-500 transition-colors duration-200"
              >
                <Github size={20} />
              </a>
            </div>
            <p className="text-gray-600 text-sm text-center md:text-left font-inter">
              Built on MultiversX
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};