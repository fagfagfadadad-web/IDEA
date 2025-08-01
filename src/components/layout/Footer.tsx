import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, X } from 'lucide-react';
import { Button, Card } from 'components';

const HowItWorksModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
      >
        How It Works
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">How It Works</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-blue-600 font-bold mb-2">For Clients</h3>
                  <div className="space-y-3 text-gray-700">
                    <p>1. Browse through our curated list of Web3 services and professionals</p>
                    <p>2. Select a gig that matches your needs and review the provider's portfolio</p>
                    <p>3. Place an order and communicate your requirements clearly</p>
                    <p>4. Track progress through our messaging system</p>
                    <p>5. Release payment and leave a review once satisfied</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-blue-600 font-bold mb-2">For Service Providers</h3>
                  <div className="space-y-3 text-gray-700">
                    <p>1. Create your professional profile</p>
                    <p>2. List your services with detailed descriptions and pricing</p>
                    <p>3. Receive order notifications and communicate with clients</p>
                    <p>4. Deliver high-quality work within the agreed timeframe</p>
                    <p>5. Get paid in EGLD and build your reputation</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-blue-600 font-bold mb-2">Smart Contract Integration</h3>
                  <div className="space-y-3 text-gray-700">
                    <p>• All transactions are secured through MultiversX smart contracts</p>
                    <p>• Payments are held in escrow until work is completed</p>
                    <p>• Automatic release of funds upon order completion</p>
                    <p>• Transparent and secure payment system</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Footer = () => {
  return (
    <div className="bg-white py-8 border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <img
              src="https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png"
              alt="IDEA Logo"
              className="h-10 w-auto"
            />
            <p className="text-gray-600 max-w-xs text-center md:text-left">
              The premier marketplace for Web3 talent on MultiversX blockchain
            </p>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center md:items-start space-y-3">
              <h3 className="font-bold text-gray-800">Platform</h3>
              <Link 
                to="/gigs" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                Browse Gigs
              </Link>
              <Link 
                to="/create-gig" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                Create Gig
              </Link>
              <HowItWorksModal />
            </div>

            <div className="flex flex-col items-center md:items-start space-y-3">
              <h3 className="font-bold text-gray-800">Resources</h3>
              <Link 
                to="/documentation" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                Documentation
              </Link>
              <Link 
                to="#" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                Blog
              </Link>
              <Link 
                to="#" 
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                Support
              </Link>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="font-bold text-gray-800">Connect</h3>
            <div className="flex items-center justify-center md:justify-start space-x-4">
              <a 
                href="https://x.com/xIdeaMarket" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#"
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};