import React, { useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { Button } from 'components';
import { useToast } from '../context/ToastContext';
import { useGetAccount, useGetNetworkConfig, Transaction, Address } from 'lib';
import { signAndSendTransactions } from '../helpers';
import { supabase } from '../lib/supabase';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onDisputeSubmitted?: () => void;
}

// Helper function to convert UUID to hex
const uuidToHex = (uuid: string): string => {
  const cleanUuid = uuid.replace(/-/g, '');
  if (cleanUuid.length !== 32) {
    throw new Error('Invalid UUID format, must have 32 hex characters without hyphens');
  }
  return cleanUuid;
};

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  order,
  onDisputeSubmitted,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();

  const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showErrorToast('Please provide a reason for the dispute');
      return;
    }

    if (!address) {
      showErrorToast('Please connect your wallet first');
      return;
    }

    if (!order?.id) {
      showErrorToast('Order ID is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert order ID to hex format for smart contract
      const hexOrderId = uuidToHex(order.id);
      
      // Create dispute transaction similar to payment/release
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`dispute@${hexOrderId}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Creating dispute transaction:', { 
        orderId: order.id, 
        hexOrderId, 
        escrowAddress: ESCROW_ADDRESS,
        reason 
      });

      // Sign and send transaction
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Creating dispute...',
          errorMessage: 'Dispute creation failed',
          successMessage: 'Dispute successfully created'
        }
      });

      console.log('Dispute created, session ID:', sessionId);

      // Update order status in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'disputed',
          status_updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Create dispute record in database
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          order_id: order.id,
          created_by: address === order.client_address ? order.client?.id : order.gig?.provider?.id,
          reason: reason.trim(),
          status: 'pending'
        });

      if (disputeError) {
        console.error('Error creating dispute record:', disputeError);
        // Don't fail the whole process if dispute record creation fails
      }

      // Send notification to the other party
      const otherPartyId = address === order.client_address ? 
        order.gig?.provider?.id : 
        order.client?.id;

      if (otherPartyId) {
        await supabase.from('notifications').insert({
          user_id: otherPartyId,
          type: 'dispute_created',
          title: 'Order Disputed',
          content: `A dispute has been created for order "${order.gig?.title || 'Custom Project'}". An admin will review the case.`,
          data: { order_id: order.id },
          read: false
        });
      }

      // Add system message to chat
      await supabase.from('messages').insert({
        order_id: order.id,
        sender_id: address === order.client_address ? order.client?.id : order.gig?.provider?.id,
        content: JSON.stringify({
          type: 'dispute_created',
          message: `⚠️ A dispute has been created for this order. Reason: ${reason.trim()}. An admin will review the case.`,
        }),
        attachments: [],
      });

      showSuccessToast('Dispute submitted successfully. An admin will review your case.');
      
      setReason('');
      onClose();
      if (onDisputeSubmitted) {
        onDisputeSubmitted();
      }
    } catch (error) {
      console.error('Dispute error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showErrorToast(`Error submitting dispute: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Initiate Dispute</h3>
              <p className="text-gray-600 text-sm">
                Please provide details about the issue with this order
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} className="text-orange-600" />
                <h4 className="text-gray-800 font-medium text-sm sm:text-base">Important Information</h4>
              </div>
              <p className="text-gray-700 text-sm">
                Initiating a dispute will lock the funds in escrow until an admin reviews the case. 
                This process may take several days to resolve.
              </p>
            </div>

            <div>
              <p className="text-gray-800 font-medium mb-2">
                Order: {order?.gig?.title || 'Custom Project'}
              </p>
              <p className="text-gray-600">
                Amount: {order?.amount} {order?.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
              </p>
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-3">
              <label className="block text-gray-800 font-medium text-sm sm:text-base">
                Reason for Dispute
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain in detail why you're disputing this order..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              />
              <p className="text-gray-500 text-xs">
                {reason.length}/1000 characters
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={18} className="text-blue-600" />
                <h4 className="text-gray-800 font-medium text-sm">Admin Review Process</h4>
              </div>
              <p className="text-gray-700 text-xs sm:text-sm">
                An admin will review your dispute and make a decision based on the evidence provided. 
                Both parties will be notified of the outcome.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 sm:py-3 px-4 rounded-lg order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 px-4 rounded-lg order-1 sm:order-2"
                disabled={!reason.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating Dispute...' : 'Submit Dispute'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};