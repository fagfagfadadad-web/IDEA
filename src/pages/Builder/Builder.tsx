import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Eye, Upload, Download, LogOut, Rocket } from 'lucide-react';
  Palette, 
  Type, 
  Image as ImageIcon,
  Code,
  Rocket,
  Plus,
  Globe,
  ExternalLink,
  FolderOpen,
  Github,
  Zap
} from 'lucide-react';
import { useBuilder } from '../../lib/store';
import { useCustomToast } from '../../hooks/useCustomToast';
import { useContractDeployment } from '../../hooks/useContractDeployment';
import { useGetIsLoggedIn } from 'lib';
import { deployToNetlify, exportForNetlify, getNetlifyAuthUrl, hasNetlifyToken, clearNetlifyToken } from '../../utils/netlifyDeploy';
import { useNavigate } from 'react-router-dom';
import { BuilderData, BuilderSchema } from '../../types/builder';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { ImagePicker } from '../../components/ui/ImagePicker';

export const Builder = () => {
  const navigate = useNavigate();
  const { data, setData, saveProject, loadProject, deleteProject, getAllProjects } = useBuilder();
  const { showToast } = useCustomToast();
  const { deployStakingContract, deployPresaleContract, isDeploying, deployedAddress } = useContractDeployment();
  const isLoggedIn = useGetIsLoggedIn();
  const [activeTab, setActiveTab] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showNetlifyAuth, setShowNetlifyAuth] = useState(false);
  const [netlifyAuthUrl, setNetlifyAuthUrl] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<BuilderData>({
    resolver: zodResolver(BuilderSchema),
    defaultValues: {
      slug: "my-project",
      template: "staking",
      theme: { 
        primary: "#4f46e5", 
        background: "#0b0b10", 
        text: "#ffffff",
        accent: "#8b5cf6"
      },
      content: { 
        projectName: "My DApp", 
        headline: "Stake & Earn Rewards", 
        description: "Earn passive income by staking your tokens with our secure smart contract platform.",
        logoDataUrl: "",
        heroImageDataUrl: "",
        features: ["High APY rewards", "Secure smart contracts", "Instant withdrawals", "24/7 support"],
        socialLinks: {
          twitter: "",
          discord: "",
          telegram: "",
          website: ""
        }
      },
      web3: { 
        contractAddress: "erd1qqqqqqqqqqqqqpgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqthllllls0lczs7", 
        tokenTicker: "STAKE", 
        apyBps: 1200,
        startTs: Math.floor(Date.now() / 1000),
        endTs: Math.floor(Date.now() / 1000) + 86400 * 30,
        minStake: 1,
        maxStake: 1000,
        totalSupply: 1000000
      },
    },
  });

  const values = watch();

  // Load data from store on mount
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const onSubmit = (formData: BuilderData) => {
    try {
      saveProject(formData.slug, formData);
      showToast(`Project "${formData.slug}" saved successfully!`, { type: 'success' });
    } catch (error) {
      showToast('Failed to save project', { type: 'error' });
    }
  };

  const handlePreview = () => {
    const currentData = values;
    setData(currentData);
    navigate(`/preview/${currentData.slug}`);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(values, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${values.slug}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Project exported successfully!', { type: 'success' });
  };

  const handlePublishToNetlify = async () => {
    const currentData = values;
    
    // Check if user has Netlify token
    const netlifyToken = localStorage.getItem('netlify_token');
    
    if (!netlifyToken) {
      // Show authorization modal
      setNetlifyAuthUrl(getNetlifyAuthUrl());
      setShowNetlifyAuth(true);
      return;
    }
    
    setIsPublishing(true);
    
    try {
      showToast('Publishing to Netlify...', { type: 'info' });
      
      const result = await deployToNetlify(currentData, netlifyToken);
      
      if (result.success && result.url) {
        setPublishedUrl(result.url);
        showToast(`Successfully published! Your site is live at: ${result.url}`, { type: 'success' });
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Publish error:', error);
      
      // Handle specific Netlify errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('exceeded usage limit') || errorMessage.includes('422') || errorMessage.includes('Cannot create more sites')) {
        showToast(
          'Your Netlify account has reached the site limit. Please upgrade your Netlify plan or delete existing sites from your Netlify dashboard to continue publishing.',
          { type: 'error' }
        );
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        showToast(
          'Your Netlify authorization has expired. Please authorize again.',
          { type: 'error' }
        );
        // Clear stored token to force re-authorization
        localStorage.removeItem('netlify_token');
      } else {
        showToast(`Publishing failed: ${errorMessage}`, { type: 'error' });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleNetlifyAuth = () => {
    // Open Netlify OAuth in new window
    window.open(netlifyAuthUrl, 'netlify-auth', 'width=600,height=700');
    // Show token input field
    setShowTokenInput(true);
  };

  const handleTokenSubmit = async () => {
    if (!tokenInput.trim()) {
      showToast('Please enter the access token', { type: 'error' });
      return;
    }

    // Save token and close modal
    localStorage.setItem('netlify_token', tokenInput.trim());
    setShowNetlifyAuth(false);
    setShowTokenInput(false);
    setTokenInput('');
    
    showToast('Netlify authorization successful! Publishing your site...', { type: 'success' });
    
    // Retry publishing with the new token
    await handlePublishToNetlify();
  };

  const handleNetlifyLogout = () => {
    clearNetlifyToken();
    setPublishedUrl(null);
    showToast('Logged out from Netlify successfully!', { type: 'success' });
  };

  const handleExportForNetlify = async () => {
    try {
      await exportForNetlify(values);
      showToast('Project exported for Netlify! Check your downloads folder.', { type: 'success' });
    } catch (error) {
      showToast('Export failed', { type: 'error' });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        const validatedData = BuilderSchema.parse(importedData);
        reset(validatedData);
        setData(validatedData);
        showToast('Project imported successfully!', { type: 'success' });
      } catch (error) {
        showToast('Invalid project file', { type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadProject = (slug: string) => {
    const project = loadProject(slug);
    if (project) {
      reset(project);
      showToast(`Project "${slug}" loaded successfully!`, { type: 'success' });
      setShowLoadModal(false);
    }
  };

  const handleDeleteProject = (slug: string) => {
    if (confirm(`Are you sure you want to delete project "${slug}"?`)) {
      deleteProject(slug);
      showToast(`Project "${slug}" deleted successfully!`, { type: 'success' });
    }
  };

  const handleDeployContract = async () => {
    if (!isLoggedIn) {
      showToast('Please connect your wallet to deploy contracts', { type: 'error' });
      return;
    }

    const currentData = values;
    let contractAddress: string | null = null;

    if (currentData.template === 'staking') {
      contractAddress = await deployStakingContract({
        tokenId: currentData.web3.tokenTicker,
        apyBps: currentData.web3.apyBps,
        minStake: currentData.web3.minStake.toString(),
        maxStake: currentData.web3.maxStake.toString(),
        startTime: currentData.web3.startTs,
        endTime: currentData.web3.endTs
      });
    } else {
      contractAddress = await deployPresaleContract({
        tokenId: currentData.web3.tokenTicker,
        pricePerToken: '1000000000000000', // 0.001 EGLD per token
        totalSupply: currentData.web3.totalSupply.toString(),
        startTime: currentData.web3.startTs,
        endTime: currentData.web3.endTs,
        minContribution: '100000000000000000', // 0.1 EGLD
        maxContribution: '10000000000000000000' // 10 EGLD
      });
    }

    if (contractAddress) {
      // Update the contract address in the form
      setValue('web3.contractAddress', contractAddress);
      
      // Save the project with the new contract address
      const updatedData = { ...currentData, web3: { ...currentData.web3, contractAddress } };
      saveProject(updatedData.slug, updatedData);
      
      showToast(`Contract deployed! Address: ${contractAddress}`, { type: 'success' });
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = values.content.features || [];
      setValue('content.features', [...currentFeatures, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = values.content.features || [];
    setValue('content.features', currentFeatures.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 0, label: 'Content', icon: <Type size={16} /> },
    { id: 1, label: 'Theme', icon: <Palette size={16} /> },
    { id: 2, label: 'Web3', icon: <Code size={16} /> },
    { id: 3, label: 'Settings', icon: <Settings size={16} /> }
  ];

  const allProjects = getAllProjects();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Rocket size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MX Builder</h1>
                <p className="text-gray-400">Build your Web3 application</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowLoadModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FolderOpen size={16} />
                Load Project
              </Button>
              
              <Button
                onClick={handlePreview}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Eye size={16} />
                Preview
              </Button>
              
              <Button
                onClick={handlePublishToNetlify}
                disabled={isPublishing}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe size={16} />
                    Publish
                  </>
                )}
              </Button>
              
              {hasNetlifyToken() && (
                <Button
                  onClick={handleNetlifyLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Logout Netlify
                </Button>
              )}
              
              <Button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Download size={16} />
                Export
              </Button>
              
              <Button
                onClick={handleExportForNetlify}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Export for Netlify
              </Button>
              
              <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Builder Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-white/10">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400 bg-white/5'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Content Tab */}
                  {activeTab === 0 && (
                    <div className="space-y-6">
                      <Field label="Project Name" required error={errors.content?.projectName?.message}>
                        <input
                          {...register('content.projectName')}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="My Awesome DApp"
                        />
                      </Field>

                      <Field label="Headline" required error={errors.content?.headline?.message}>
                        <input
                          {...register('content.headline')}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Stake & Earn Rewards"
                        />
                      </Field>

                      <Field label="Description" required error={errors.content?.description?.message}>
                        <textarea
                          {...register('content.description')}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Describe your project and its benefits..."
                        />
                      </Field>

                      <Field label="Logo">
                        <ImagePicker
                          value={values.content.logoDataUrl}
                          onDataUrl={(dataUrl) => setValue('content.logoDataUrl', dataUrl)}
                          onRemove={() => setValue('content.logoDataUrl', '')}
                          label="Upload Logo"
                        />
                      </Field>

                      <Field label="Hero Image">
                        <ImagePicker
                          value={values.content.heroImageDataUrl}
                          onDataUrl={(dataUrl) => setValue('content.heroImageDataUrl', dataUrl)}
                          onRemove={() => setValue('content.heroImageDataUrl', '')}
                          label="Upload Hero Image"
                        />
                      </Field>

                      <Field label="Features">
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newFeature}
                              onChange={(e) => setNewFeature(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                              placeholder="Add a feature..."
                              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Button
                              type="button"
                              onClick={addFeature}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {values.content.features?.map((feature, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-lg">
                                <span className="text-white text-sm">{feature}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Field>

                      <Field label="Social Links">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            {...register('content.socialLinks.twitter')}
                            placeholder="Twitter URL"
                            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            {...register('content.socialLinks.discord')}
                            placeholder="Discord URL"
                            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            {...register('content.socialLinks.telegram')}
                            placeholder="Telegram URL"
                            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            {...register('content.socialLinks.website')}
                            placeholder="Website URL"
                            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </Field>
                    </div>
                  )}

                  {/* Theme Tab */}
                  {activeTab === 1 && (
                    <div className="space-y-6">
                      <Field label="Primary Color" description="Main brand color used for buttons and accents">
                        <ColorPicker
                          value={values.theme.primary}
                          onChange={(color) => setValue('theme.primary', color)}
                          label="Primary"
                        />
                      </Field>

                      <Field label="Background Color" description="Main background color of your site">
                        <ColorPicker
                          value={values.theme.background}
                          onChange={(color) => setValue('theme.background', color)}
                          label="Background"
                        />
                      </Field>

                      <Field label="Text Color" description="Primary text color">
                        <ColorPicker
                          value={values.theme.text}
                          onChange={(color) => setValue('theme.text', color)}
                          label="Text"
                        />
                      </Field>

                      <Field label="Accent Color" description="Secondary color for highlights and borders">
                        <ColorPicker
                          value={values.theme.accent}
                          onChange={(color) => setValue('theme.accent', color)}
                          label="Accent"
                        />
                      </Field>

                      {/* Color Preview */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-3">Color Preview</h4>
                        <div 
                          className="rounded-lg p-4 border"
                          style={{ 
                            backgroundColor: values.theme.background,
                            borderColor: values.theme.accent,
                            color: values.theme.text
                          }}
                        >
                          <div className="space-y-3">
                            <h5 className="font-bold">Sample Content</h5>
                            <p className="opacity-80">This is how your text will look</p>
                            <div 
                              className="inline-block px-4 py-2 rounded-lg font-medium"
                              style={{ backgroundColor: values.theme.primary, color: '#ffffff' }}
                            >
                              Sample Button
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Web3 Tab */}
                  {activeTab === 2 && (
                    <div className="space-y-6">
                      <Field label="Template Type" required>
                        <select
                          {...register('template')}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="staking">Staking Platform</option>
                          <option value="presale">Token Presale</option>
                        </select>
                      </Field>

                      <Field label="Smart Contract Address" required error={errors.web3?.contractAddress?.message}>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleDeployContract}
                              disabled={isDeploying || !isLoggedIn}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                              {isDeploying ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Deploying...
                                </>
                              ) : (
                                <>
                                  <Zap size={16} />
                                  Deploy Contract
                                </>
                              )}
                            </Button>
                            
                            {!isLoggedIn && (
                              <p className="text-yellow-400 text-sm flex items-center">
                                Connect wallet to deploy
                              </p>
                            )}
                          </div>
                          
                          {deployedAddress && (
                            <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-3">
                              <p className="text-green-300 text-sm font-medium mb-1">✅ Contract Successfully Deployed!</p>
                              <p className="text-green-200 text-xs font-mono break-all">{deployedAddress}</p>
                            </div>
                          )}
                          
                          {values.web3.contractAddress && values.web3.contractAddress !== 'erd1qqqqqqqqqqqqqpgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqthllllls0lczs7' && (
                            <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-3">
                              <p className="text-blue-300 text-sm font-medium mb-1">📋 Current Contract</p>
                              <p className="text-blue-200 text-xs font-mono break-all">{values.web3.contractAddress}</p>
                            </div>
                          )}
                          
                          <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-3">
                            <p className="text-blue-300 text-sm font-medium mb-1">💡 How it works</p>
                            <p className="text-blue-200 text-xs">
                              1. Set your token parameters below<br/>
                              2. Click "Deploy Contract" to create your {values.template} contract<br/>
                              3. Sign transaction in xPortal wallet<br/>
                              4. Get your contract address automatically<br/>
                              5. Your site will use the deployed contract<br/>
                              <strong>Deployment fee: ~0.05 EGLD</strong>
                            </p>
                          </div>
                        </div>
                      </Field>

                      <Field label="Token Ticker" required error={errors.web3?.tokenTicker?.message}>
                        <input
                          {...register('web3.tokenTicker')}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your existing token ID (e.g. MYTOKEN-abc123)"
                        />
                      </Field>

                      {values.template === 'staking' ? (
                        <>
                          <Field label="APY (Basis Points)" description="10000 = 100%, 1200 = 12%" error={errors.web3?.apyBps?.message}>
                            <input
                              type="number"
                              {...register('web3.apyBps')}
                              min="0"
                              max="10000"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1200"
                            />
                          </Field>

                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Min Stake" error={errors.web3?.minStake?.message}>
                              <input
                                type="number"
                                {...register('web3.minStake')}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1"
                              />
                            </Field>

                            <Field label="Max Stake" error={errors.web3?.maxStake?.message}>
                              <input
                                type="number"
                                {...register('web3.maxStake')}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1000"
                              />
                            </Field>
                          </div>
                        </>
                      ) : (
                        <>
                          <Field label="Price per Token (in EGLD)" description="How much EGLD for 1 token" error={errors.web3?.totalSupply?.message}>
                            <input
                              type="number"
                              step="0.000001"
                              min="0"
                              defaultValue="0.001"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="0.001"
                            />
                          </Field>

                          <Field label="Total Supply" error={errors.web3?.totalSupply?.message}>
                            <input
                              type="number"
                              {...register('web3.totalSupply')}
                              min="0"
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="1000000"
                            />
                          </Field>

                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Presale Start">
                              <input
                                type="datetime-local"
                                value={new Date(values.web3.startTs * 1000).toISOString().slice(0, 16)}
                                onChange={(e) => setValue('web3.startTs', Math.floor(new Date(e.target.value).getTime() / 1000))}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </Field>

                            <Field label="Presale End">
                              <input
                                type="datetime-local"
                                value={new Date(values.web3.endTs * 1000).toISOString().slice(0, 16)}
                                onChange={(e) => setValue('web3.endTs', Math.floor(new Date(e.target.value).getTime() / 1000))}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </Field>
                          </div>

                          <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-3">
                            <p className="text-yellow-300 text-sm font-medium mb-1">📋 Presale Setup</p>
                            <p className="text-yellow-200 text-xs">
                              1. Enter your existing token ID<br/>
                              2. Set price (how much EGLD per 1 token)<br/>
                              3. Set total tokens for sale<br/>
                              4. Choose start/end dates<br/>
                              5. Deploy contract with these parameters
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Settings Tab */}
                  {activeTab === 3 && (
                    <div className="space-y-6">
                      <Field label="Project Slug" required error={errors.slug?.message} description="URL-friendly identifier for your project">
                        <input
                          {...register('slug')}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="my-project"
                        />
                      </Field>

                      <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-4">
                        <h4 className="text-blue-300 font-medium mb-2">Preview URL</h4>
                        <p className="text-blue-200 text-sm font-mono break-all">
                          /preview/{values.slug}
                        </p>
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-3">Project Actions</h4>
                        <div className="space-y-3">
                          <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Save size={16} />
                            Save Project
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(values, null, 2));
                              showToast('Configuration copied to clipboard!', { type: 'success' });
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Copy size={16} />
                            Copy Config
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Live Preview</h3>
              <div className="space-y-4">
                <div 
                  className="w-full h-32 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center"
                  style={{ backgroundColor: values.theme.background }}
                >
                  <div className="text-center" style={{ color: values.theme.text }}>
                    <div className="text-2xl mb-1">🚀</div>
                    <p className="text-sm opacity-80">Preview</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: values.theme.primary }}
                    />
                    <span className="text-white text-sm">Primary: {values.theme.primary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: values.theme.background }}
                    />
                    <span className="text-white text-sm">Background: {values.theme.background}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handlePreview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Full Preview
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Project Stats</h3>
              <div className="space-y-3">
                {publishedUrl && (
                  <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-3 mb-4">
                    <p className="text-green-300 text-sm font-medium mb-2">🚀 Published Successfully!</p>
                    <a 
                      href={publishedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-200 text-xs font-mono break-all hover:underline"
                    >
                      {publishedUrl}
                    </a>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Template:</span>
                  <span className="text-white capitalize">{values.template}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token:</span>
                  <span className="text-white">{values.web3.tokenTicker}</span>
                </div>
                {values.template === 'staking' ? (
                  <div className="flex justify-between">
                    <span className="text-gray-400">APY:</span>
                    <span className="text-white">{(values.web3.apyBps / 100).toFixed(2)}%</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Supply:</span>
                    <span className="text-white">{values.web3.totalSupply.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Features:</span>
                  <span className="text-white">{values.content.features?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Deployment Guide */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">🚀 Deployment</h3>
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                    <Github size={16} />
                    Full dApp Deployment (Recommended)
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Deploy your complete React dApp with full wallet integration and smart contract functionality.
                  </p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Click "Deploy Full dApp"</li>
                    <li>Authorize GitHub to create repository</li>
                    <li>Connect repository to Netlify</li>
                    <li>Get fully functional dApp with wallet integration</li>
                  </ol>
                </div>
                
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <Rocket size={16} />
                    Quick Deploy (Static Preview)
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    Deploy a static preview instantly to Netlify (limited functionality).
                  </p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Click "Publish to Netlify"</li>
                    <li>Authorize with your Netlify account</li>
                    <li>Get instant live URL (demo functionality only)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showNetlifyAuth && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Globe size={32} className="text-white" />
                </div>
                
                {!showTokenInput ? (
                  <>
                    <h3 className="text-xl font-bold text-white">Connect Your Netlify Account</h3>
                    <p className="text-gray-300">
                      To publish your site, you need to authorize MX Builder to deploy to <strong>your own</strong> Netlify account.
                    </p>
                    <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-3">
                      <p className="text-blue-300 text-sm font-medium mb-1">📋 How it works:</p>
                      <p className="text-blue-200 text-xs">
                        1. Click "Authorize with Your Netlify"<br/>
                        2. Sign in to <strong>your own</strong> Netlify account<br/>
                        3. Grant permission to deploy sites to <strong>your account</strong><br/>
                        4. Copy the access token from Netlify<br/>
                        5. Paste it in the next step
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={handleNetlifyAuth}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={16} />
                        Authorize with Your Netlify
                      </Button>
                      <Button
                        onClick={() => setShowNetlifyAuth(false)}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white">Enter Access Token</h3>
                    <p className="text-gray-300">
                      Copy the access token from your Netlify account and paste it below:
                    </p>
                    <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-3">
                      <p className="text-yellow-300 text-sm font-medium mb-1">🔑 Where to find your token:</p>
                      <p className="text-yellow-200 text-xs">
                        After authorizing on <strong>your Netlify account</strong>, Netlify will show you an access token.<br/>
                        Copy the entire token and paste it in the field below.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="Paste your Netlify access token here..."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      />
                      <Button
                        onClick={handleTokenSubmit}
                        disabled={!tokenInput.trim()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg disabled:opacity-50"
                      >
                        Save Token & Deploy
                      </Button>
                      <Button
                        onClick={() => {
                          setShowTokenInput(false);
                          setTokenInput('');
                        }}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg"
                      >
                        Back
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Load Project Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Load Project</h3>
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              {allProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No saved projects found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allProjects.map((project) => (
                    <div key={project.slug} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">{project.content.projectName}</h4>
                          <p className="text-gray-400 text-sm">/{project.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleLoadProject(project.slug)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Load
                          </Button>
                          <Button
                            onClick={() => handleDeleteProject(project.slug)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};