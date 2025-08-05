import React, { useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { Button, Card } from 'components';
import { useToast } from '../context/ToastContext';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onDisputeSubmitted?: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  order,
  onDisputeSubmitted,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showErrorToast('Please provide a reason for the dispute');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Mock dispute submission - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Submitting dispute:', { orderId: order.id, reason });
      
      showSuccessToast('Dispute submitted successfully. An admin will review your case.');
      
      setReason('');
      onClose();
      if (onDisputeSubmitted) {
        onDisputeSubmitted();
      }
    } catch (error) {
      showErrorToast('Error submitting dispute. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Initiate Dispute</h3>
            <p className="text-gray-400 text-sm">
              Please provide details about the issue with this order
            </p>
          </div>

          <div className="bg-orange-900 border border-orange-500 rounded-md p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} className="text-orange-400" />
              <h4 className="text-white font-medium">Important Information</h4>
            </div>
            <p className="text-white text-sm">
              Initiating a dispute will lock the funds in escrow until an admin reviews the case. 
              This process may take several days to resolve.
            </p>
          </div>

          <div>
            <p className="text-white font-medium mb-2">
              Order: {order?.gig_id?.title || 'Custom Project'}
            </p>
            <p className="text-gray-400">
              Amount: {order?.amount} {order?.payment_token || 'EGLD'}
            </p>
          </div>

          <hr className="border-gray-600" />

          <div className="space-y-3">
            <label className="block text-white font-medium">
              Reason for Dispute
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain in detail why you're disputing this order..."
              rows={4}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
            <p className="text-gray-400 text-xs">
              {reason.length}/1000 characters
            </p>
          </div>

          <div className="bg-blue-900 border border-blue-500 rounded-md p-4">
            <div className="flex items-center gap-3 mb-2">
              <Shield size={20} className="text-blue-400" />
              <h4 className="text-white font-medium text-sm">Admin Review Process</h4>
            </div>
            <p className="text-white text-xs">
              An admin will review your dispute and make a decision based on the evidence provided. 
              Both parties will be notified of the outcome.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg order-1 sm:order-2"
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};