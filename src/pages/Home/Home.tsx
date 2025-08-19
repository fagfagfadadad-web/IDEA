import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'components';
import { Code, Palette, Zap, Globe, ArrowRight, Rocket, Shield, Layers } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Code size={24} />,
      title: "No-Code Builder",
      description: "Create Web3 applications without writing a single line of code"
    },
    {
      icon: <Palette size={24} />,
      title: "Custom Branding",
      description: "Fully customize colors, logos, and content to match your brand"
    },
    {
      icon: <Zap size={24} />,
      title: "Smart Contracts",
      description: "Integrate with MultiversX smart contracts for staking and presales"
    },
    {
      icon: <Globe size={24} />,
      title: "One-Click Deploy",
      description: "Deploy your site to IPFS or traditional hosting with one click"
    }
  ];

  const templates = [
    {
      name: "Staking Platform",
      description: "Create a branded staking site with APY rewards and wallet integration",
      image: "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg",
      features: ["Custom APY rates", "Wallet integration", "Real-time rewards", "Mobile responsive"]
    },
    {
      name: "Token Presale",
      description: "Launch your token presale with progress tracking and contribution management",
      image: "https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg",
      features: ["Progress tracking", "Whitelist support", "Contribution limits", "Automatic distribution"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Layers size={32} className="text-white" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  MX Builder
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                The ultimate no-code platform for building branded Web3 applications on MultiversX blockchain
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/builder')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                <Rocket size={20} />
                Start Building
                <ArrowRight size={20} />
              </Button>
              <Button
                onClick={() => navigate('/preview/demo')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-300">Everything you need to build professional Web3 applications</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Ready-to-Use Templates</h2>
          <p className="text-xl text-gray-300">Choose from our professionally designed templates</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          {templates.map((template, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300">
              <div className="relative h-48">
                <img 
                  src={template.image} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-white">{template.name}</h3>
                <p className="text-gray-300">{template.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Features:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {template.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/builder')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium"
                >
                  Use This Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center">
          <div className="space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Shield size={40} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white">Ready to Build?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of developers building the future of Web3 on MultiversX
            </p>
            <Button
              onClick={() => navigate('/builder')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 rounded-2xl font-semibold text-xl flex items-center gap-3 mx-auto transition-all duration-200 hover:scale-105"
            >
              <Rocket size={24} />
              Start Building Now
              <ArrowRight size={24} />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Layers size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">MX Builder</span>
              </div>
              <p className="text-gray-400">
                Empowering developers to build the future of Web3 on MultiversX
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Platform</h3>
              <div className="space-y-2">
                <Link to="/builder" className="block text-gray-400 hover:text-white transition-colors">
                  Builder
                </Link>
                <Link to="/preview/demo" className="block text-gray-400 hover:text-white transition-colors">
                  Demo
                </Link>
                <Link to="/disclaimer" className="block text-gray-400 hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Resources</h3>
              <div className="space-y-2">
                <a href="https://docs.multiversx.com" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-white transition-colors">
                  MultiversX Docs
                </a>
                <a href="https://github.com/multiversx" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-white transition-colors">
                  GitHub
                </a>
                <a href="https://multiversx.com" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-white transition-colors">
                  MultiversX
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 MX Builder. Built with ❤️ for the MultiversX ecosystem.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};