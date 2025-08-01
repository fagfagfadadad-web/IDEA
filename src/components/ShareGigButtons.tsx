import React from 'react';
import { Share2, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { Button } from 'components';

interface ShareGigButtonsProps {
  gigId: string;
  gigTitle: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost' | 'outline';
  showLabel?: boolean;
  colorScheme?: string;
}

export const ShareGigButtons: React.FC<ShareGigButtonsProps> = ({
  gigId,
  gigTitle,
  size = 'md',
  variant = 'ghost',
  showLabel = false,
  colorScheme = 'blue'
}) => {
  const [hasCopied, setHasCopied] = React.useState(false);
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  
  const shareUrl = `${window.location.origin}/gigs/${gigId}`;
  const shareTitle = `Check out this gig: ${gigTitle}`;
  const shareText = `I found this amazing gig on IDEA Marketplace: ${gigTitle}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
      alert('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        alert('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          alert('Error sharing');
        }
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
    setShowShareMenu(false);
  };

  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedinUrl, '_blank');
    setShowShareMenu(false);
  };

  // If native sharing is available, show a single share button
  if (typeof navigator.share === 'function') {
    return (
      <Button
        onClick={handleShare}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Share2 size={16} />
        {showLabel && 'Share'}
      </Button>
    );
  }

  // Otherwise, show a dropdown with multiple share options
  return (
    <div className="relative">
      <Button
        onClick={handleShare}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Share2 size={16} />
        {showLabel && 'Share'}
      </Button>
      
      {showShareMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 p-2 min-w-48">
            <p className="text-white text-sm font-medium mb-3 px-2">
              Share this gig
            </p>
            <div className="flex gap-2">
              <button
                onClick={shareOnTwitter}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                title="Share on Twitter"
              >
                <Twitter size={18} />
              </button>
              <button
                onClick={shareOnFacebook}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-700 rounded transition-colors"
                title="Share on Facebook"
              >
                <Facebook size={18} />
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-700 rounded transition-colors"
                title="Share on LinkedIn"
              >
                <Linkedin size={18} />
              </button>
              <button
                onClick={copyToClipboard}
                className={`p-2 hover:bg-gray-700 rounded transition-colors ${
                  hasCopied ? 'text-green-400' : 'text-gray-400 hover:text-white'
                }`}
                title={hasCopied ? 'Copied!' : 'Copy link'}
              >
                {hasCopied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};