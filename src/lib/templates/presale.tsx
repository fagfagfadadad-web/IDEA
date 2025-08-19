import React, { useState } from 'react';
import { DollarSign, Clock, Users, Target, ExternalLink, Twitter, MessageSquare, Globe } from 'lucide-react';
import { Button } from '../../components/Button';
import { WalletConnect } from '../../components/WalletConnect';
import { useWallet } from '../wallet';
import { ThemeData, ContentData, Web3Data } from '../schema';

interface PresaleTemplateProps {
  theme: ThemeData;
  content: ContentData;
  web3: Web3Data;
}

export const PresaleTemplate: React.FC<PresaleTemplateProps> = ({
  theme,
  content,
  web3,
}) => {
  const [amount, setAmount] = useState<number>(1);
  const [isBuying, setIsBuying] = useState(false);
  const { address, isConnected, login } = useWallet();

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter size={20} />;
      case 'discord': return <MessageSquare size={20} />;
      case 'telegram': return <MessageSquare size={20} />;
      case 'website': return <Globe size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

  const handleBuy = async () => {
    if (!isConnected) {
      await login();
      return;
    }

    setIsBuying(true);
    try {
      // Mock presale transaction - replace with real smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully purchased ${amount} ${web3.tokenTicker}!`);
    } catch (error) {
      alert('Purchase failed. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  // Calculate presale progress (mock data)
  const soldTokens = Math.floor(web3.totalSupply * 0.35); // 35% sold
  const progressPercentage = (soldTokens / web3.totalSupply) * 100;
  const timeLeft = Math.max(0, web3.endTs - Math.floor(Date.now() / 1000));
  const daysLeft = Math.floor(timeLeft / 86400);
  const hoursLeft = Math.floor((timeLeft % 86400) / 3600);

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.primary}20 100%)`,
        color: theme.text 
      }}
    >
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {content.logoDataUrl ? (
              <img 
                src={content.logoDataUrl} 
                alt={`${content.projectName} logo`}
                className="h-12 w-12 rounded-lg object-cover border border-white/20"
              />
            ) : (
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg border border-white/20"
                style={{ backgroundColor: theme.primary }}
              >
                {content.projectName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xl font-bold">{content.projectName}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="#presale"
              className="px-6 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: theme.primary,
                color: '#ffffff'
              }}
            >
              Join Presale
            </a>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {content.headline}
            </h1>
            <p className="text-xl opacity-80 leading-relaxed">
              {content.description}
            </p>
            
            {/* Features */}
            {content.features && content.features.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Why Join Our Presale:</h3>
                <ul className="space-y-2">
                  {content.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="opacity-80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Social Links */}
            {content.socialLinks && Object.entries(content.socialLinks).some(([_, url]) => url) && (
              <div className="flex items-center gap-4">
                <span className="text-sm opacity-60">Follow us:</span>
                {Object.entries(content.socialLinks).map(([platform, url]) => {
                  if (!url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {getSocialIcon(platform)}
                    </a>
                  );
                })}
              </div>
            )}
            
            <a 
              href="#presale" 
              className="inline-block px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: theme.primary,
                color: '#ffffff'
              }}
            >
              Join Presale Now
            </a>
          </div>
          
          <div className="relative">
            {content.heroImageDataUrl ? (
              <img 
                src={content.heroImageDataUrl} 
                alt="Hero image"
                className="w-full rounded-2xl border border-white/20 shadow-2xl"
              />
            ) : (
              <div 
                className="w-full h-96 rounded-2xl border border-white/20 flex items-center justify-center"
                style={{ backgroundColor: `${theme.primary}10` }}
              >
                <div className="text-center opacity-60">
                  <div className="text-4xl mb-2">💎</div>
                  <p>Hero Image Placeholder</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Presale Section */}
      <section id="presale" className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Token Presale</h2>
          <p className="text-lg opacity-80">
            Get {web3.tokenTicker} tokens at presale price before public launch
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div 
            className="rounded-2xl p-6 border backdrop-blur-sm"
            style={{ 
              backgroundColor: `${theme.primary}20`,
              borderColor: `${theme.primary}40`,
              color: theme.text
            }}
          >
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progressPercentage}%`,
                      backgroundColor: theme.primary 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs opacity-60">
                  <span>{soldTokens.toLocaleString()} sold</span>
                  <span>{web3.totalSupply.toLocaleString()} total</span>
                </div>
              </div>

              {/* Time Left */}
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-yellow-400" />
                  <span className="text-sm font-medium">Time Remaining</span>
                </div>
                <p className="text-lg font-bold">
                  {daysLeft}d {hoursLeft}h
                </p>
              </div>

              {/* Purchase Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (EGLD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:border-transparent"
                      style={{ '--focus-ring-color': theme.primary } as React.CSSProperties}
                      placeholder="Enter EGLD amount"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-sm font-medium opacity-80">EGLD</span>
                    </div>
                  </div>
                </div>

                {/* Token Calculation */}
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-green-400" />
                    <span className="text-sm font-medium">You will receive</span>
                  </div>
                  <p className="text-lg font-bold">
                    {(amount * 1000).toFixed(0)} {web3.tokenTicker}
                  </p>
                  <p className="text-xs opacity-60">
                    Rate: 1 EGLD = 1,000 {web3.tokenTicker}
                  </p>
                </div>

                {/* Buy Button */}
                <Button
                  onClick={handleBuy}
                  disabled={isBuying || amount <= 0}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {isBuying ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    `Buy ${web3.tokenTicker} Tokens`
                  )}
                </Button>

                {/* Connection Status */}
                {!isConnected && (
                  <div className="text-center">
                    <p className="text-sm opacity-60 mb-3">Connect your wallet to participate</p>
                    <Button
                      onClick={login}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </div>

              {/* Contract Info */}
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-sm font-medium">Smart Contract</span>
                </div>
                <p className="text-xs font-mono opacity-80 break-all">
                  {web3.contractAddress}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="text-center">
                <p className="text-xs opacity-60">
                  (Demo widget - connect to real smart contract for production)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="opacity-60 text-sm">
            Built with MX Builder • Powered by MultiversX
          </p>
        </div>
      </footer>
    </div>
  );
};