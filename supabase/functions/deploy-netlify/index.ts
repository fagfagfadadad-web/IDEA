import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const NETLIFY_CLIENT_ID = 'R2TnAioMNRFS8juEh_f8swXbAQ-GbzsTYI0nsIEUG38'
const NETLIFY_CLIENT_SECRET = 'AHV--1P1UWnWyrJCdMqcyGrrR5CZcB-jJRxVfjXWU3k'
const NETLIFY_REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

interface DeployRequest {
  projectData: {
    slug: string;
    template: 'staking' | 'presale';
    theme: {
      primary: string;
      background: string;
      text: string;
      accent: string;
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
      startTs: number;
      endTs: number;
      minStake: number;
      maxStake: number;
      totalSupply: number;
    };
  };
  netlifyToken?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectData, netlifyToken }: DeployRequest = await req.json()

    // If no token provided, return OAuth URL for user to authorize
    if (!netlifyToken) {
      const authUrl = `https://app.netlify.com/authorize?client_id=${NETLIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(NETLIFY_REDIRECT_URI)}&scope=deploy`
      
      return new Response(
        JSON.stringify({
          success: false,
          needsAuth: true,
          authUrl: authUrl,
          message: 'Please authorize with Netlify first'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Generate static HTML content
    const htmlContent = generateStaticHTML(projectData)
    
    // Create site on Netlify
    const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${projectData.slug}-${Date.now()}`,
        custom_domain: null,
      }),
    })

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text()
      throw new Error(`Failed to create site: ${siteResponse.status} ${errorText}`)
    }

    const site = await siteResponse.json()
    
    // Create deployment with files
    const files = {
      'index.html': htmlContent,
      '_redirects': '/*    /index.html   200',
      'README.md': generateReadme(projectData)
    }

    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${netlifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: files,
        draft: false,
        branch: 'main'
      }),
    })

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text()
      throw new Error(`Failed to deploy: ${deployResponse.status} ${errorText}`)
    }

    const deployment = await deployResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        url: site.url,
        deployUrl: deployment.deploy_url,
        siteId: site.id,
        deployId: deployment.id,
        adminUrl: site.admin_url,
        message: `Successfully deployed to ${site.url}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Deployment error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

function generateStaticHTML(projectData: DeployRequest['projectData']): string {
  const { theme, content, web3, template } = projectData;
  
  const socialLinksHtml = Object.entries(content.socialLinks || {})
    .filter(([_, url]) => url)
    .map(([platform, url]) => {
      const iconMap: Record<string, string> = {
        twitter: '🐦',
        discord: '💬',
        telegram: '📱',
        website: '🌐'
      };
      return `
        <a href="${url}" target="_blank" rel="noopener noreferrer" 
           style="display: inline-block; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-right: 8px; text-decoration: none; color: inherit;">
          ${iconMap[platform] || '🔗'}
        </a>
      `;
    }).join('');

  const featuresHtml = (content.features || [])
    .map(feature => `
      <li style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 8px; height: 8px; background: ${theme.primary}; border-radius: 50%;"></div>
        <span style="opacity: 0.8;">${feature}</span>
      </li>
    `).join('');

  const logoHtml = content.logoDataUrl 
    ? `<img src="${content.logoDataUrl}" alt="${content.projectName} logo" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);" />`
    : `<div style="width: 48px; height: 48px; background: ${theme.primary}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; border: 1px solid rgba(255,255,255,0.2);">${content.projectName.charAt(0).toUpperCase()}</div>`;

  const heroImageHtml = content.heroImageDataUrl
    ? `<img src="${content.heroImageDataUrl}" alt="Hero image" style="width: 100%; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);" />`
    : `<div style="width: 100%; height: 384px; background: ${theme.primary}20; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
         <div style="text-align: center; opacity: 0.6;">
           <div style="font-size: 48px; margin-bottom: 8px;">${template === 'staking' ? '🚀' : '💎'}</div>
           <p>Hero Image Placeholder</p>
         </div>
       </div>`;

  const widgetHtml = template === 'staking' 
    ? generateStakingWidget(theme, web3)
    : generatePresaleWidget(theme, web3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.projectName}</title>
    <meta name="description" content="${content.description}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, ${theme.background} 0%, ${theme.primary}20 100%);
            color: ${theme.text};
            min-height: 100vh;
        }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        .header { padding: 24px 0; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-text { font-size: 20px; font-weight: bold; }
        .nav-button {
            padding: 8px 24px; background: ${theme.primary}; color: #ffffff;
            border: none; border-radius: 9999px; font-weight: 500;
            cursor: pointer; transition: all 0.2s; text-decoration: none;
            display: inline-block;
        }
        .nav-button:hover { transform: scale(1.05); }
        .hero { padding: 64px 0; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .hero-content { display: flex; flex-direction: column; gap: 24px; }
        .hero-title { font-size: 48px; font-weight: bold; line-height: 1.1; }
        .hero-description { font-size: 20px; opacity: 0.8; line-height: 1.6; }
        .features-section { margin: 24px 0; }
        .features-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .features-list { list-style: none; }
        .social-links { display: flex; align-items: center; gap: 16px; }
        .social-text { font-size: 14px; opacity: 0.6; }
        .cta-button {
            display: inline-block; padding: 16px 32px; background: ${theme.primary};
            color: #ffffff; border: none; border-radius: 16px; font-weight: 600;
            font-size: 18px; cursor: pointer; transition: all 0.2s; text-decoration: none;
        }
        .cta-button:hover { transform: scale(1.05); }
        .widget-section { padding: 96px 0; }
        .widget-container { max-width: 512px; margin: 0 auto; }
        .widget-header { text-align: center; margin-bottom: 48px; }
        .widget-title { font-size: 32px; font-weight: bold; margin-bottom: 16px; }
        .widget-subtitle { font-size: 18px; opacity: 0.8; }
        .footer { border-top: 1px solid rgba(255,255,255,0.1); padding: 32px 0; text-align: center; }
        .footer-text { opacity: 0.6; font-size: 14px; }
        @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr; gap: 32px; }
            .hero-title { font-size: 36px; }
            .header-content { flex-direction: column; gap: 16px; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo-section">
                    ${logoHtml}
                    <span class="logo-text">${content.projectName}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <a href="#${template}" class="nav-button">
                        ${template === 'staking' ? 'Launch App' : 'Join Presale'}
                    </a>
                    <button onclick="connectWallet()" style="background: #4f46e5; color: #ffffff; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer;">
                        Connect Wallet
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="hero">
        <div class="container">
            <div class="hero-grid">
                <div class="hero-content">
                    <h1 class="hero-title">${content.headline}</h1>
                    <p class="hero-description">${content.description}</p>
                    
                    ${content.features && content.features.length > 0 ? `
                    <div class="features-section">
                        <h3 class="features-title">${template === 'staking' ? 'Key Features:' : 'Why Join Our Presale:'}</h3>
                        <ul class="features-list">${featuresHtml}</ul>
                    </div>
                    ` : ''}

                    ${socialLinksHtml ? `
                    <div class="social-links">
                        <span class="social-text">Follow us:</span>
                        ${socialLinksHtml}
                    </div>
                    ` : ''}
                    
                    <a href="#${template}" class="cta-button">
                        ${template === 'staking' ? 'Start Staking' : 'Join Presale Now'}
                    </a>
                </div>
                <div>${heroImageHtml}</div>
            </div>
        </div>
    </main>

    <section id="${template}" class="widget-section">
        <div class="container">
            <div class="widget-header">
                <h2 class="widget-title">
                    ${template === 'staking' ? 'Stake & Earn Rewards' : 'Token Presale'}
                </h2>
                <p class="widget-subtitle">
                    ${template === 'staking' 
                        ? `Stake your ${web3.tokenTicker} tokens and earn up to ${(web3.apyBps / 100).toFixed(2)}% APY`
                        : `Get ${web3.tokenTicker} tokens at presale price before public launch`
                    }
                </p>
            </div>
            <div class="widget-container">${widgetHtml}</div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p class="footer-text">Built with MX Builder • Powered by MultiversX</p>
        </div>
    </footer>

    <script>
        function connectWallet() {
            alert('This is a demo. In production, this would connect to MultiversX wallet.');
        }
        
        function stakeTokens() {
            alert('This is a demo. In production, this would interact with the smart contract.');
        }
        
        function buyTokens() {
            alert('This is a demo. In production, this would interact with the smart contract.');
        }
        
        // Smooth scrolling
        document.addEventListener('DOMContentLoaded', function() {
            const anchorLinks = document.querySelectorAll('a[href^="#"]');
            anchorLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        });
    </script>
</body>
</html>`;
}

function generateStakingWidget(theme: any, web3: any): string {
  return `
    <div style="background: ${theme.primary}20; border: 1px solid ${theme.primary}40; border-radius: 16px; padding: 24px; backdrop-filter: blur(10px);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h3 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Stake ${web3.tokenTicker}</h3>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; opacity: 0.8;">
          <span>📈</span>
          <span>APY: ${(web3.apyBps / 100).toFixed(2)}%</span>
        </div>
      </div>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="color: #10b981;">🛡️</span>
          <span style="font-size: 14px; font-weight: 500;">Smart Contract</span>
        </div>
        <p style="font-size: 12px; font-family: monospace; opacity: 0.8; word-break: break-all;">
          ${web3.contractAddress}
        </p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Amount to Stake</label>
        <div style="position: relative;">
          <input type="number" value="${web3.minStake}" min="${web3.minStake}" max="${web3.maxStake}" 
                 style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: ${theme.text};" />
          <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%);">
            <span style="font-size: 14px; font-weight: 500; opacity: 0.8;">${web3.tokenTicker}</span>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; opacity: 0.6; margin-top: 4px;">
          <span>Min: ${web3.minStake} ${web3.tokenTicker}</span>
          <span>Max: ${web3.maxStake} ${web3.tokenTicker}</span>
        </div>
      </div>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="color: #fbbf24;">💰</span>
          <span style="font-size: 14px; font-weight: 500;">Estimated Annual Rewards</span>
        </div>
        <p style="font-size: 18px; font-weight: bold;">
          ${(web3.minStake * (web3.apyBps / 10000)).toFixed(4)} ${web3.tokenTicker}
        </p>
        <p style="font-size: 12px; opacity: 0.6;">
          Based on ${(web3.apyBps / 100).toFixed(2)}% APY
        </p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <button onclick="stakeTokens()" style="padding: 12px; background: ${theme.primary}; color: #ffffff; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">
          Stake
        </button>
        <button onclick="stakeTokens()" style="padding: 12px; background: #4b5563; color: #ffffff; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">
          Unstake
        </button>
      </div>
      
      <div style="text-align: center; margin-top: 16px;">
        <p style="font-size: 12px; opacity: 0.6; margin-bottom: 8px;">Connect your wallet to start staking</p>
        <button onclick="connectWallet()" style="background: #4f46e5; color: #ffffff; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer;">
          Connect Wallet
        </button>
      </div>
      
      <div style="text-align: center; margin-top: 16px;">
        <p style="font-size: 12px; opacity: 0.6;">
          (Demo widget - connect to real smart contract for production)
        </p>
      </div>
    </div>
  `;
}

function generatePresaleWidget(theme: any, web3: any): string {
  const soldTokens = Math.floor(web3.totalSupply * 0.35);
  const progressPercentage = (soldTokens / web3.totalSupply) * 100;
  
  return `
    <div style="background: ${theme.primary}20; border: 1px solid ${theme.primary}40; border-radius: 16px; padding: 24px; backdrop-filter: blur(10px);">
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 12px;">
          <span>Progress</span>
          <span>${progressPercentage.toFixed(1)}%</span>
        </div>
        <div style="width: 100%; background: rgba(0,0,0,0.3); border-radius: 9999px; height: 12px;">
          <div style="height: 12px; background: ${theme.primary}; border-radius: 9999px; width: ${progressPercentage}%; transition: width 0.5s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; opacity: 0.6; margin-top: 4px;">
          <span>${soldTokens.toLocaleString()} sold</span>
          <span>${web3.totalSupply.toLocaleString()} total</span>
        </div>
      </div>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="color: #fbbf24;">⏰</span>
          <span style="font-size: 14px; font-weight: 500;">Time Remaining</span>
        </div>
        <p style="font-size: 18px; font-weight: bold;">15d 8h</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Amount (EGLD)</label>
        <div style="position: relative;">
          <input type="number" value="1" min="0.1" step="0.1" 
                 style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: ${theme.text};" />
          <div style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%);">
            <span style="font-size: 14px; font-weight: 500; opacity: 0.8;">EGLD</span>
          </div>
        </div>
      </div>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="color: #10b981;">🎯</span>
          <span style="font-size: 14px; font-weight: 500;">You will receive</span>
        </div>
        <p style="font-size: 18px; font-weight: bold;">1,000 ${web3.tokenTicker}</p>
        <p style="font-size: 12px; opacity: 0.6;">Rate: 1 EGLD = 1,000 ${web3.tokenTicker}</p>
      </div>
      
      <button onclick="buyTokens()" style="width: 100%; padding: 12px; background: ${theme.primary}; color: #ffffff; border: none; border-radius: 8px; font-weight: 500; margin-bottom: 16px; cursor: pointer;">
        Buy ${web3.tokenTicker} Tokens
      </button>
      
      <div style="text-align: center; margin-bottom: 16px;">
        <p style="font-size: 12px; opacity: 0.6; margin-bottom: 12px;">Connect your wallet to participate</p>
        <button onclick="connectWallet()" style="background: #4f46e5; color: #ffffff; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer;">
          Connect Wallet
        </button>
      </div>
      
      <div style="background: rgba(0,0,0,0.2); border-radius: 8px; padding: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="color: #3b82f6;">👥</span>
          <span style="font-size: 14px; font-weight: 500;">Smart Contract</span>
        </div>
        <p style="font-size: 12px; font-family: monospace; opacity: 0.8; word-break: break-all;">
          ${web3.contractAddress}
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 16px;">
        <p style="font-size: 12px; opacity: 0.6;">
          (Demo widget - connect to real smart contract for production)
        </p>
      </div>
    </div>
  `;
}

function generateReadme(projectData: DeployRequest['projectData']): string {
  return `# ${projectData.content.projectName}

This is a static export of your Web3 application built with MX Builder.

## Deployment Instructions

This site has been automatically deployed to Netlify.

## Important Notes

- This is a static HTML version of your dApp
- Interactive features (wallet connection, smart contract interactions) are demo-only
- For full functionality, you'll need to implement the complete React application with MultiversX SDK
- The smart contract address in this export is: ${projectData.web3.contractAddress}

## Project Configuration

- Template: ${projectData.template}
- Token: ${projectData.web3.tokenTicker}
${projectData.template === 'staking' ? `- APY: ${(projectData.web3.apyBps / 100).toFixed(2)}%` : `- Total Supply: ${projectData.web3.totalSupply.toLocaleString()}`}

Built with MX Builder
`;
}