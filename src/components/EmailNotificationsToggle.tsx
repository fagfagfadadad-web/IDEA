import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from 'components';

interface EmailNotificationsToggleProps {
  enabled: boolean;
}

export const EmailNotificationsToggle: React.FC<EmailNotificationsToggleProps> = ({
  enabled
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEnabled(!isEnabled);
      alert(`Email notifications ${!isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      alert('Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      
      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      alert('Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white text-sm font-medium mb-2">Email Address</label>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="relative w-20 flex-shrink-0">
            {!isLoading && !showSuccess && (
              <Button
                onClick={handleEmailSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-2 rounded-lg text-sm"
              >
                Add
              </Button>
            )}
            {isLoading && !showSuccess && (
              <div className="w-full h-[48px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            )}
            {showSuccess && (
              <div className="w-full h-[48px] bg-green-500 rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-white text-sm font-medium">
          Email Notifications
        </label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            disabled={isLoading}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
        </label>
      </div>
    </div>
  );
};