import { BuilderData } from '../lib/schema';

// GitHub API configuration
const GITHUB_API_BASE = 'https://api.github.com';

export interface GitDeployConfig {
  githubToken: string;
  repoName: string;
  repoDescription?: string;
}

export interface DeploymentResult {
  success: boolean;
  repoUrl?: string;
  netlifyUrl?: string;
  error?: string;
}

// Generate complete React project files based on builder data
export const generateProjectFiles = (projectData: BuilderData): Record<string, string> => {
  const { theme, content, web3, template } = projectData;

  // Generate package.json
  const packageJson = {
    name: projectData.slug,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@multiversx/sdk-dapp": "^5.x",
      "@multiversx/sdk-core": "^14.2.6",
      "lucide-react": "^0.525.0"
    },
    devDependencies: {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "@vitejs/plugin-react": "^4.1.0",
      "autoprefixer": "^10.4.16",
      "postcss": "^8.4.30",
      "tailwindcss": "^3.3.3",
      "typescript": "^5.2.2",
      "vite": "^4.4.9"
    }
  };

  // Generate vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})`;

  // Generate tailwind.config.js
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

  // Generate postcss.config.js
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

  // Generate tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }]
  };

  // Generate index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${content.projectName}</title>
    <meta name="description" content="${content.description}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  // Generate main.tsx
  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

  // Generate App.tsx
  const appTsx = `import React from 'react'
import { ${template === 'staking' ? 'StakingTemplate' : 'PresaleTemplate'} } from './components/${template === 'staking' ? 'StakingTemplate' : 'PresaleTemplate'}'

const theme = ${JSON.stringify(theme, null, 2)};
const content = ${JSON.stringify(content, null, 2)};
const web3 = ${JSON.stringify(web3, null, 2)};

function App() {
  return (
    <${template === 'staking' ? 'StakingTemplate' : 'PresaleTemplate'}
      theme={theme}
      content={content}
      web3={web3}
    />
  )
}

export default App`;

  // Generate CSS
  const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: ${theme.background};
  color: ${theme.text};
  min-height: 100vh;
}`;

  // Generate template component
  const templateComponent = template === 'staking' 
    ? generateStakingComponent(theme, content, web3)
    : generatePresaleComponent(theme, content, web3);

  // Generate wallet hook
  const walletHook = `import { useState, useEffect } from 'react';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const login = async () => {
    try {
      // Mock wallet connection - replace with real MultiversX SDK integration
      const mockAddress = 'erd1qqqqqqqqqqqqqpgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqthllllls0lczs7';
      setAddress(mockAddress);
      setIsConnected(true);
      alert('Wallet connected! (Demo mode)');
    } catch (error) {
      alert('Failed to connect wallet');
    }
  };

  const logout = () => {
    setAddress(null);
    setIsConnected(false);
  };

  return {
    address,
    isConnected,
    login,
    logout,
  };
}

export function formatAddress(address: string | null): string {
  if (!address) return '';
  return \`\${address.slice(0, 8)}...\${address.slice(-6)}\`;
}`;

  // Generate WalletConnect component
  const walletConnectComponent = `import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useWallet, formatAddress } from '../hooks/useWallet';

export const WalletConnect: React.FC = () => {
  const { address, isConnected, login, logout } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {isConnected && address ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-mono text-white/80">
              {formatAddress(address)}
            </span>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Wallet size={16} />
          Connect Wallet
        </button>
      )}
    </div>
  );
};`;

  // Generate netlify.toml for proper deployment
  const netlifyToml = `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

  // Generate README
  const readme = `# ${content.projectName}

${content.description}

## Built with MX Builder

This is a ${template} dApp built using MX Builder - a no-code Web3 builder for MultiversX.

### Features
- MultiversX wallet integration
- Smart contract interactions
- Responsive design
- ${template === 'staking' ? 'Token staking functionality' : 'Token presale functionality'}

### Smart Contract
- Address: \`${web3.contractAddress}\`
- Token: ${web3.tokenTicker}
${template === 'staking' ? `- APY: ${(web3.apyBps / 100).toFixed(2)}%` : `- Total Supply: ${web3.totalSupply.toLocaleString()}`}

### Development

\`\`\`bash
npm install
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

Built with ❤️ using MX Builder
`;

  return {
    'package.json': JSON.stringify(packageJson, null, 2),
    'vite.config.ts': viteConfig,
    'tailwind.config.js': tailwindConfig,
    'postcss.config.js': postcssConfig,
    'tsconfig.json': JSON.stringify(tsConfig, null, 2),
    'index.html': indexHtml,
    'src/main.tsx': mainTsx,
    'src/App.tsx': appTsx,
    'src/index.css': indexCss,
    [`src/components/${template === 'staking' ? 'StakingTemplate' : 'PresaleTemplate'}.tsx`]: templateComponent,
    'src/hooks/useWallet.ts': walletHook,
    'src/components/WalletConnect.tsx': walletConnectComponent,
    'netlify.toml': netlifyToml,
    'README.md': readme,
    '.gitignore': `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/dist
/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db`
  };
};

function generateStakingComponent(theme: any, content: any, web3: any): string {
  return `import React, { useState } from 'react';
import { DollarSign, TrendingUp, Shield } from 'lucide-react';
import { WalletConnect } from './WalletConnect';
import { useWallet } from '../hooks/useWallet';

interface StakingTemplateProps {
  theme: {
    primary: string;
    background: string;
    text: string;
  };
  content: {
    projectName: string;
    headline: string;
    description: string;
    logoDataUrl?: string;
    heroImageDataUrl?: string;
    features?: string[];
    socialLinks?: {
      twitter?: string;
      discord?: string;
      telegram?: string;
      website?: string;
    };
  };
  web3: {
    contractAddress: string;
    tokenTicker: string;
    apyBps: number;
    minStake: number;
    maxStake: number;
  };
}

export const StakingTemplate: React.FC<StakingTemplateProps> = ({
  theme,
  content,
  web3,
}) => {
  const [amount, setAmount] = useState<number>(web3.minStake);
  const [isStaking, setIsStaking] = useState(false);
  const { address, isConnected, login } = useWallet();

  const handleStake = async () => {
    if (!isConnected) {
      await login();
      return;
    }

    setIsStaking(true);
    try {
      // TODO: Replace with real MultiversX smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(\`Successfully staked \${amount} \${web3.tokenTicker}!\`);
    } catch (error) {
      alert('Staking failed. Please try again.');
    } finally {
      setIsStaking(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      discord: '💬', 
      telegram: '📱',
      website: '🌐'
    };
    return icons[platform] || '🔗';
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: \`linear-gradient(135deg, \${theme.background} 0%, \${theme.primary}20 100%)\`,
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
                alt={\`\${content.projectName} logo\`}
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
                style={{ backgroundColor: \`\${theme.primary}10\` }}
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
          <div 
            className="rounded-2xl p-6 border backdrop-blur-sm"
            style={{ 
              backgroundColor: \`\${theme.primary}20\`,
              borderColor: \`\${theme.primary}40\`,
              color: theme.text
            }}
          >
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Stake {web3.tokenTicker}</h3>
                <div className="flex items-center justify-center gap-2 text-sm opacity-80">
                  <TrendingUp size={16} />
                  <span>APY: {(web3.apyBps / 100).toFixed(2)}%</span>
                </div>
              </div>

              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-green-400" />
                  <span className="text-sm font-medium">Smart Contract</span>
                </div>
                <p className="text-xs font-mono opacity-80 break-all">
                  {web3.contractAddress}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount to Stake
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={web3.minStake}
                      max={web3.maxStake}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:border-transparent"
                      placeholder={\`Min: \${web3.minStake}, Max: \${web3.maxStake}\`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-sm font-medium opacity-80">{web3.tokenTicker}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-yellow-400" />
                    <span className="text-sm font-medium">Estimated Annual Rewards</span>
                  </div>
                  <p className="text-lg font-bold">
                    {(amount * (web3.apyBps / 10000)).toFixed(4)} {web3.tokenTicker}
                  </p>
                  <p className="text-xs opacity-60">
                    Based on {(web3.apyBps / 100).toFixed(2)}% APY
                  </p>
                </div>

                <button
                  onClick={handleStake}
                  disabled={isStaking || amount < web3.minStake || amount > web3.maxStake}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  style={{ 
                    backgroundColor: theme.primary,
                    color: '#ffffff'
                  }}
                >
                  {isStaking ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Staking...
                    </div>
                  ) : (
                    'Stake Tokens'
                  )}
                </button>

                {!isConnected && (
                  <div className="text-center">
                    <p className="text-sm opacity-60 mb-3">Connect your wallet to start staking</p>
                  </div>
                )}
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
};`;
}

function generatePresaleComponent(theme: any, content: any, web3: any): string {
  return `import React, { useState } from 'react';
import { DollarSign, Clock, Users, Target } from 'lucide-react';
import { WalletConnect } from './WalletConnect';
import { useWallet } from '../hooks/useWallet';

interface PresaleTemplateProps {
  theme: {
    primary: string;
    background: string;
    text: string;
  };
  content: {
    projectName: string;
    headline: string;
    description: string;
    logoDataUrl?: string;
    heroImageDataUrl?: string;
    features?: string[];
    socialLinks?: {
      twitter?: string;
      discord?: string;
      telegram?: string;
      website?: string;
    };
  };
  web3: {
    contractAddress: string;
    tokenTicker: string;
    totalSupply: number;
  };
}

export const PresaleTemplate: React.FC<PresaleTemplateProps> = ({
  theme,
  content,
  web3,
}) => {
  const [amount, setAmount] = useState<number>(1);
  const [isBuying, setIsBuying] = useState(false);
  const { address, isConnected, login } = useWallet();

  const handleBuy = async () => {
    if (!isConnected) {
      await login();
      return;
    }

    setIsBuying(true);
    try {
      // TODO: Replace with real MultiversX smart contract call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(\`Successfully purchased \${amount * 1000} \${web3.tokenTicker}!\`);
    } catch (error) {
      alert('Purchase failed. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, string> = {
      twitter: '🐦',
      discord: '💬',
      telegram: '📱', 
      website: '🌐'
    };
    return icons[platform] || '🔗';
  };

  const soldTokens = Math.floor(web3.totalSupply * 0.35);
  const progressPercentage = (soldTokens / web3.totalSupply) * 100;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: \`linear-gradient(135deg, \${theme.background} 0%, \${theme.primary}20 100%)\`,
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
                alt={\`\${content.projectName} logo\`}
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
                style={{ backgroundColor: \`\${theme.primary}10\` }}
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
              backgroundColor: \`\${theme.primary}20\`,
              borderColor: \`\${theme.primary}40\`,
              color: theme.text
            }}
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: \`\${progressPercentage}%\`,
                      backgroundColor: theme.primary 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs opacity-60">
                  <span>{soldTokens.toLocaleString()} sold</span>
                  <span>{web3.totalSupply.toLocaleString()} total</span>
                </div>
              </div>

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
                      placeholder="Enter EGLD amount"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-sm font-medium opacity-80">EGLD</span>
                    </div>
                  </div>
                </div>

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

                <button
                  onClick={handleBuy}
                  disabled={isBuying || amount <= 0}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                  style={{ 
                    backgroundColor: theme.primary,
                    color: '#ffffff'
                  }}
                >
                  {isBuying ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    \`Buy \${web3.tokenTicker} Tokens\`
                  )}
                </button>

                {!isConnected && (
                  <div className="text-center">
                    <p className="text-sm opacity-60 mb-3">Connect your wallet to participate</p>
                  </div>
                )}
              </div>

              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-sm font-medium">Smart Contract</span>
                </div>
                <p className="text-xs font-mono opacity-80 break-all">
                  {web3.contractAddress}
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
};`;
}

// Deploy to GitHub and connect to Netlify
export const deployFullDApp = async (
  projectData: BuilderData,
  githubToken: string
): Promise<DeploymentResult> => {
  try {
    // Generate all project files
    const projectFiles = generateProjectFiles(projectData);
    
    // Create GitHub repository
    const repoResult = await createGitHubRepo({
      githubToken,
      repoName: projectData.slug,
      repoDescription: `${projectData.content.projectName} - Built with MX Builder`
    });

    if (!repoResult.success) {
      return { success: false, error: repoResult.error };
    }

    // Upload files to repository
    const uploadResult = await uploadFilesToRepo({
      githubToken,
      repoName: projectData.slug,
      files: projectFiles
    });

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    return {
      success: true,
      repoUrl: repoResult.repoUrl,
      netlifyUrl: `https://app.netlify.com/start/deploy?repository=${repoResult.repoUrl}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    };
  }
};

// Create GitHub repository
async function createGitHubRepo(config: {
  githubToken: string;
  repoName: string;
  repoDescription: string;
}): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/user/repos`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        name: config.repoName,
        description: config.repoDescription,
        private: false,
        auto_init: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create repository');
    }

    const repo = await response.json();
    return {
      success: true,
      repoUrl: repo.html_url
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create repository'
    };
  }
}

// Upload files to GitHub repository
async function uploadFilesToRepo(config: {
  githubToken: string;
  repoName: string;
  files: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user info to construct repo path
    const userResponse = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const user = await userResponse.json();
    const repoPath = `${user.login}/${config.repoName}`;

    // Upload each file
    for (const [filePath, content] of Object.entries(config.files)) {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${repoPath}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${config.githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Add ${filePath}`,
          content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
          branch: 'main'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload ${filePath}: ${error.message}`);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload files'
    };
  }
}

// GitHub OAuth URL
export const getGitHubAuthUrl = (): string => {
  const clientId = 'Ov23liAqGJvF8zKqJQpE'; // GitHub OAuth App Client ID for MX Builder
  const redirectUri = encodeURIComponent(window.location.origin);
  const scope = 'repo';
  
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
};

// Check if user has GitHub token
export const hasGitHubToken = (): boolean => {
  return !!localStorage.getItem('github_token');
};

// Clear GitHub token
export const clearGitHubToken = (): void => {
  localStorage.removeItem('github_token');
};