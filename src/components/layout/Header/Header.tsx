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

if (!projectData) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Project Not Found</h1>
        <p className="text-gray-400">The project "{slug}" could not be found.</p>
        <Button
          onClick={() => navigate('/builder')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Go to Builder
        </Button>
      </div>
    </div>
  );
}

return (
  <div className="relative">
    {/* Preview Controls */}
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/builder')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Builder
            </Button>
            <div className="text-white">
              <span className="text-sm opacity-60">Previewing: </span>
              <span className="font-medium">{projectData.content.projectName}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(`/builder?project=${slug}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Edit size={16} />
              Edit
            </Button>
            
            <Button
              onClick={handleShare}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Share size={16} />
              Share
            </Button>
            
            <Button
              onClick={handleExport}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Template Render */}
    <div className="pt-20">
      {projectData.template === 'staking' ? (
        <StakingTemplate
          theme={projectData.theme}
          content={projectData.content}
          web3={projectData.web3}
        />
      ) : (
        <PresaleTemplate
          theme={projectData.theme}
          content={projectData.content}
          web3={projectData.web3}
        />
      )}
    </div>
  </div>
);