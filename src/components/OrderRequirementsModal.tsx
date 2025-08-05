import React, { useState } from 'react';
import { useCreateOrder } from '../hooks/useOrders';
import { useGetIsLoggedIn } from 'lib';
import { Button, Card } from 'components';
import { useToast } from '../context/ToastContext';

interface OrderRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gig: any;
  onOrderCreated: (orderId: string) => void;
}

export const OrderRequirementsModal: React.FC<OrderRequirementsModalProps> = ({
  isOpen,
  onClose,
  gig,
  onOrderCreated,
}) => {
  const [requirements, setRequirements] = useState('');
  const createOrder = useCreateOrder();
  const isLoggedIn = useGetIsLoggedIn();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Mock user and profile - replace with real auth context
  const user = isLoggedIn ? { id: 'user1', username: 'testuser' } : null;
  const loading = false;
  const isProfileReady = true;

  // Early return if modal is not open or gig is not available
  if (!isOpen || !gig) {
    return null;
  }

  const handleSubmit = async () => {
    if (!user || !isProfileReady) {
      alert('Please wait while we finish setting up your profile');
      return;
    }

    if (!requirements.trim()) {
      alert('Please provide at least some basic requirements');
      return;
    }

    // Additional safety check for gig
    if (!gig?.id) {
      alert('Gig information is not available. Please try again.');
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        gig_id: gig?.id,
        amount: gig?.price || 0,
        requirements: {
          description: requirements,
          timestamp: new Date().toISOString(),
        },
      });

      showSuccessToast('Order placed successfully. The provider will review your order.');
      onOrderCreated(order?.id);
    } catch (error) {
      showErrorToast('Error placing order. Please try again later.');
    }
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4" data-debug="modal-wrapper">
          <Card
            className="p-4 sm:p-6 w-full bg-gray-900"
            title="Loading Profile"
            reference="#"
            data-debug="loading-card"
          >
            <div className="w-full">
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-white">Loading your profile...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-4" data-debug="modal-wrapper">
        <Card
          className="p-4 sm:p-6 w-full bg-gray-900 max-h-[90vh] overflow-y-auto"
          reference="#"
          data-debug="modal-card"
        >
          <div className="w-full space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white">Order Requirements</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm sm:text-base md:text-lg font-medium text-white">
                {gig?.title || 'Loading...'}
              </h4>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base">
                Please provide your project requirements. This will help the provider
                understand your needs better.
              </p>
              <div>
                <label className="block text-white text-xs sm:text-sm font-medium mb-2">
                  Project Requirements
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe your project requirements, timeline, and any specific details..."
                  rows={4}
                  className="w-full p-2 sm:p-3 text-sm sm:text-base bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={onClose}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg text-sm sm:text-base order-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createOrder.isLoading || !isProfileReady || !gig?.id}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-sm sm:text-base order-1"
              >
                {createOrder.isLoading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};