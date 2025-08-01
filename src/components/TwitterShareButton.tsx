import React from 'react';
import { Twitter } from 'lucide-react';
import { Button } from 'components';

interface TwitterShareButtonProps {
  gigId: string;
  gigTitle: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost' | 'outline';
  showLabel?: boolean;
  colorScheme?: string;
}

export const TwitterShareButton: React.FC<TwitterShareButtonProps> = ({
  gigId,
  gigTitle,
  size = 'md',
  variant = 'ghost',
  showLabel = false,
  colorScheme = 'blue'
}) => {
  const shareUrl = `${window.location.origin}/gigs/${gigId}`;
  const shareText = `Check out this gig on IDEA Marketplace: ${gigTitle}`;
  
  const shareOnTwitter = () => {
    try {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
      
      console.log('Opening Twitter share dialog');
    } catch (error) {
      console.error('Error sharing on Twitter:', error);
      alert('Could not open Twitter');
    }
  };

  if (showLabel) {
    return (
      <Button
        onClick={shareOnTwitter}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Twitter size={16} />
        Share on X
      </Button>
    );
  }

  return (
    <button
      onClick={shareOnTwitter}
      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
      title="Share on X (Twitter)"
    >
      <Twitter size={18} />
    </button>
  );
};