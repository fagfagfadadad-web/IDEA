import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <div className="bg-slate-900/95 backdrop-blur-lg py-8 border-t border-cyan-500/20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <span className="text-2xl font-orbitron font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                ZEND
              </span>
            </div>
            <p className="text-gray-400 max-w-xs text-center md:text-left">
              The ultimate space mining adventure on MultiversX blockchain
            </p>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center md:items-start space-y-3">
              <h3 className="font-orbitron font-bold text-white">Game</h3>
              <Link 
                to="/mining" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Mining
              </Link>
              <Link 
                to="/ships" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Ships
              </Link>
              <Link 
                to="/shop" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Shop
              </Link>
              <Link 
                to="/leaderboard" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Leaderboard
              </Link>
            </div>

            <div className="flex flex-col items-center md:items-start space-y-3">
              <h3 className="font-orbitron font-bold text-white">Community</h3>
              <Link 
                to="/tasks" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Tasks
              </Link>
              <Link 
                to="/referrals" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Referrals
              </Link>
              <a 
                href="#" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Discord
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                Telegram
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="font-orbitron font-bold text-white">Connect</h3>
            <div className="flex items-center justify-center md:justify-start space-x-4">
              <a 
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                <Github size={20} />
              </a>
            </div>
            <p className="text-gray-500 text-sm text-center md:text-left">
              Built on MultiversX
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};