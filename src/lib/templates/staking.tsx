import React from 'react';
import { ExternalLink, Twitter, MessageSquare, Globe } from 'lucide-react';
import { StakingWidget } from '../../components/StakingWidget';
import { WalletConnect } from '../../components/WalletConnect';
import { ThemeData, ContentData, Web3Data } from '../schema';

interface StakingTemplateProps {
  theme: ThemeData;
  content: ContentData;
  web3: Web3Data;
}

export const StakingTemplate: React.FC<StakingTemplateProps> = ({
  theme,
  content,
  web3,
}) => {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter size={20} />;
      case 'discord': return <MessageSquare size={20} />;
      case 'telegram': return <MessageSquare size={20} />;
      case 'website': return <Globe size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

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
              href="#stake"
              className="px-6 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: theme.primary,
                color: '#ffffff'
              }}
            >
              Launch App
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
                <h3 className="text-lg font-semibold">Key Features:</h3>
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
              href="#stake" 
              className="inline-block px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: theme.primary,
                color: '#ffffff'
              }}
            >
              Start Staking
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
                  <div className="text-4xl mb-2">🚀</div>
                  <p>Hero Image Placeholder</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Staking Section */}
      <section id="stake" className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Stake & Earn Rewards</h2>
          <p className="text-lg opacity-80">
            Stake your {web3.tokenTicker} tokens and earn up to {(web3.apyBps / 100).toFixed(2)}% APY
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <StakingWidget
            contract={web3.contractAddress}
            token={web3.tokenTicker}
            apyBps={web3.apyBps}
            minStake={web3.minStake}
            maxStake={web3.maxStake}
            theme={theme}
          />
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