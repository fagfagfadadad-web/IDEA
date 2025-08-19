import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Share } from 'lucide-react';
import { Button } from 'components';
import { StakingTemplate } from '../../lib/templates/staking';
import { PresaleTemplate } from '../../lib/templates/presale';
import { useBuilder } from '../../lib/store';
import { BuilderData } from '../../lib/schema';

export const Preview = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { loadProject, data } = useBuilder();
  const [projectData, setProjectData] = useState<BuilderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      navigate('/builder');
      return;
    }

    // Try to load from store first
    const stored = loadProject(slug);
    if (stored) {
      setProjectData(stored);
      setIsLoading(false);
      return;
    }

    // If not found in store, check if it's the demo
    if (slug === 'demo') {
      const demoData: BuilderData = {
        slug: 'demo',
        template: 'staking',
        theme: {
          primary: '#4f46e5',
          background: '#0b0b10',
          text: '#ffffff',
          accent: '#8b5cf6'
        },
        content: {
          projectName: 'DemoStake',
          headline: 'Stake & Earn 12% APY',
          description: 'Secure your tokens and earn passive rewards with our battle-tested smart contracts.',
          logoDataUrl: '',
          heroImageDataUrl: '',
          features: [
            'High APY rewards up to 12%',
            'Audited smart contracts',
            'Instant withdrawals',
            'No lock-up periods'
          ],
          socialLinks: {
            twitter: 'https://twitter.com/multiversx',
            discord: 'https://discord.gg/multiversx',
            telegram: 'https://t.me/MultiversX',
            website: 'https://multiversx.com'
          }
        },
        web3: {
          contractAddress: 'erd1qqqqqqqqqqqqqpgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqthllllls0lczs7',
          tokenTicker: 'DEMO',
          apyBps: 1200,
          startTs: Math.floor(Date.now() / 1000),
          endTs: Math.floor(Date.now() / 1000) + 86400 * 30,
          minStake: 1,
          maxStake: 1000,
          totalSupply: 1000000,
          pricePerToken: 0.001
        }
      };
      setProjectData(demoData);
      setIsLoading(false);
      return;
    }

    // Use current data from builder if available
    if (data && data.slug === slug) {
      setProjectData(data);
      setIsLoading(false);
      return;
    }

    // Project not found
    setIsLoading(false);
  }, [slug, loadProject, data, navigate]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectData?.content.projectName || 'MX Builder Project',
          text: projectData?.content.description || 'Check out this Web3 application',
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('URL copied to clipboard!');
      } catch (error) {
        alert('Failed to copy URL');
      }
    }
  };

  const handleExport = () => {
    if (!projectData) return;
    
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectData.slug}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading preview...</p>
        </div>
      </div>
    );
  }

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
};