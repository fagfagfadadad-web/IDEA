import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Code as CodeIcon, FileText, Book, Zap, Shield, Coins } from 'lucide-react';
import { Card } from 'components';

export const Documentation = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);

  // Set active tab based on URL parameter
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'whitepaper') setActiveTab(1);
    else if (section === 'tokenomics') setActiveTab(2);
    else if (section === 'api') setActiveTab(3);
    else if (section === 'staking') setActiveTab(4);
    else setActiveTab(0);
  }, [searchParams]);

  const tabs = [
    { id: 0, label: 'Quickstart', icon: <CodeIcon size={16} /> },
    { id: 1, label: 'Whitepaper', icon: <FileText size={16} /> },
    { id: 2, label: 'Tokenomics', icon: <Coins size={16} /> },
    { id: 3, label: 'API', icon: <Book size={16} /> },
    { id: 4, label: 'Staking', icon: <Zap size={16} /> },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 bg-white min-h-screen">
      <Card className="p-6 mb-8" title="IDEA Documentation" reference="#">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">IDEA Documentation</h1>
        <p className="text-gray-600">
          Welcome to the official documentation for the IDEA platform. Here you'll find comprehensive guides and documentation to help you start working with IDEA as quickly as possible.
        </p>
      </Card>

      <Card className="overflow-hidden" title="Documentation Sections" reference="#">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <div className="flex overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 min-w-[120px] ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-gray-800'
                    : 'border-transparent text-gray-400 hover:text-blue-400'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 bg-white">
          {activeTab === 0 && <QuickstartContent />}
          {activeTab === 1 && <WhitepaperContent />}
          {activeTab === 2 && <TokenomicsContent />}
          {activeTab === 3 && <APIContent />}
          {activeTab === 4 && <StakingContent />}
        </div>
      </Card>
    </div>
  );
};

const QuickstartContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Getting Started with IDEA</h2>
      <p className="text-gray-700">
        IDEA is a decentralized marketplace for Web3 services built on the MultiversX blockchain. This guide will help you get started with using the platform.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Key Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 border border-gray-300 rounded-lg bg-gray-50">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Secure Escrow</h4>
          <p className="text-gray-700">Smart contract-based escrow system for secure payments and dispute resolution.</p>
        </div>
        <div className="p-5 border border-gray-300 rounded-lg bg-gray-50">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Talent Marketplace</h4>
          <p className="text-gray-700">Connect with skilled Web3 developers, designers, and blockchain experts.</p>
        </div>
        <div className="p-5 border border-gray-300 rounded-lg bg-gray-50">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Web3 Native</h4>
          <p className="text-gray-700">Purpose-built for blockchain developers, DeFi experts, and Web3 innovators.</p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Setup</h3>
      <div className="space-y-3">
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <div className="text-gray-700">
            <p className="font-bold text-gray-800">Connect your wallet</p>
            <p>Use xPortal or MultiversX browser extension to connect your wallet to the platform.</p>
          </div>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <div className="text-gray-700">
            <p className="font-bold text-gray-800">Create your profile</p>
            <p>Set up your profile with your skills, experience, and portfolio.</p>
          </div>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <div className="text-gray-700">
            <p className="font-bold text-gray-800">Browse or create gigs</p>
            <p>Browse available services or create your own gig to offer your skills.</p>
          </div>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <div className="text-gray-700">
            <p className="font-bold text-gray-800">Secure payments</p>
            <p>All payments are secured through smart contracts with escrow protection.</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Smart Contract Addresses</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="font-bold mb-2 text-gray-800">Escrow Contract</p>
          <code className="p-2 bg-gray-200 text-gray-800 text-sm rounded block overflow-x-auto">
            erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0
          </code>
        </div>
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="font-bold mb-2 text-gray-800">IDA Token</p>
          <code className="p-2 bg-gray-200 text-gray-800 text-sm rounded block overflow-x-auto">
            erd1qqqqqqqqqqqqqpgqfhnxunkpfeghxn72a8fq73dst50xgjrjpmuq4f7t39
          </code>
        </div>
      </div>
    </div>
  </div>
);

const WhitepaperContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">IDEA Whitepaper</h2>
      <p className="text-gray-700">
        This document outlines the vision, technology, and roadmap for the IDEA platform, a decentralized marketplace for Web3 services built on the MultiversX blockchain.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Abstract</h3>
      <p className="text-gray-700">
        IDEA is a decentralized marketplace that connects Web3 talent with clients seeking blockchain and cryptocurrency services. By leveraging smart contracts on the MultiversX blockchain, IDEA provides a secure, efficient, and transparent platform for freelancers and clients to collaborate on Web3 projects.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Problem Statement</h3>
      <p className="text-gray-700 mb-4">
        The Web3 ecosystem faces several challenges when it comes to talent acquisition and project collaboration:
      </p>
      <div className="space-y-3">
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <p className="text-gray-700">Lack of specialized platforms for Web3 talent</p>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <p className="text-gray-700">Trust issues in remote work arrangements</p>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <p className="text-gray-700">Payment security concerns</p>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <p className="text-gray-700">High fees on traditional freelance platforms</p>
        </div>
        <div className="flex items-start">
          <CheckCircle className="text-blue-400 mr-3 mt-1" size={16} />
          <p className="text-gray-700">Difficulty in finding verified Web3 experts</p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Roadmap</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded-md">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Q2 2025: Alpha Launch</h4>
          <p className="text-gray-700">Initial platform launch with core features including gig creation, ordering, and escrow payments</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-md">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Q3 2025: Beta Release</h4>
          <p className="text-gray-700">Enhanced features including dispute resolution, reputation system, and IDEA token integration</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-md">
          <h4 className="text-lg font-bold text-gray-800 mb-2">Q4 2025: Full Launch</h4>
          <p className="text-gray-700">Complete platform with all features, mobile app, and expanded categories</p>
        </div>
      </div>
    </div>
  </div>
);

const TokenomicsContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">IDEA Token Economics</h2>
      <p className="text-gray-700">
        The IDEA token is the native utility token of the IDEA platform, designed to incentivize participation, reduce fees, and enable governance.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Token Distribution</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-700">Total Supply:</span>
            <span className="font-bold text-gray-800">25,000,000 IDEA</span>
          </div>
          <hr className="border-gray-300" />
          <div className="flex justify-between">
            <span className="text-gray-700">Public Sale:</span>
            <span className="font-bold text-gray-800">50% (12,500,000 IDEA)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Private Investors:</span>
            <span className="font-bold text-gray-800">20% (5,000,000 IDEA)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Initial Liquidity:</span>
            <span className="font-bold text-gray-800">15% (3,750,000 IDEA)</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Token Utility</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-5 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Coins size={24} className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Fee Reduction</h4>
            </div>
            <p className="text-gray-700">
              Users paying with IDEA tokens enjoy zero platform fees, compared to the standard 10% fee when paying with EGLD.
            </p>
          </div>
          <div className="p-5 border border-gray-300 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Governance</h4>
            </div>
            <p className="text-gray-700">
              IDEA token holders can participate in platform governance decisions through voting.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const APIContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">API Documentation</h2>
      <p className="text-gray-700">
        The IDEA API is currently under development and will be available soon. This documentation provides a preview of the upcoming API endpoints and functionality.
      </p>
      <div className="bg-blue-900 border border-blue-500 rounded-md p-3 mt-4">
        <div className="flex items-center">
          <span className="text-blue-400 mr-2">ℹ️</span>
          <span className="text-white">API access is not yet publicly available. This documentation is for preview purposes only.</span>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Endpoints</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-gray-700">Endpoint</th>
              <th className="text-left p-3 text-gray-700">Method</th>
              <th className="text-left p-3 text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">/api/gigs</td>
              <td className="p-3 text-gray-700">GET</td>
              <td className="p-3 text-gray-700">List all available gigs</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">/api/gigs/{'{id}'}</td>
              <td className="p-3 text-gray-700">GET</td>
              <td className="p-3 text-gray-700">Get a specific gig by ID</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">/api/orders</td>
              <td className="p-3 text-gray-700">POST</td>
              <td className="p-3 text-gray-700">Create a new order</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const StakingContent = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">IDEA Token Staking</h2>
      <p className="text-gray-700">
        Stake your IDEA tokens to earn rewards and participate in platform governance. This documentation outlines the staking mechanism, rewards, and how to participate.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Staking Periods</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 text-gray-700">Lock Period</th>
              <th className="text-left p-3 text-gray-700">Multiplier</th>
              <th className="text-left p-3 text-gray-700">Early Unstake Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">Flexible</td>
              <td className="p-3 text-gray-700">1x</td>
              <td className="p-3 text-gray-700">None</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">30 Days</td>
              <td className="p-3 text-gray-700">1.2x</td>
              <td className="p-3 text-gray-700">5%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">90 Days</td>
              <td className="p-3 text-gray-700">1.5x</td>
              <td className="p-3 text-gray-700">10%</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-3 text-gray-700">365 Days</td>
              <td className="p-3 text-gray-700">3x</td>
              <td className="p-3 text-gray-700">20%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);