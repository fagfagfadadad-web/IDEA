import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useGetAccount, useGetNetworkConfig, Transaction, Address } from 'lib';
import { signAndSendTransactions } from '../helpers';

export const useDisputes = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDisputes();
  }, [user?.id]);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.is_admin) {
        setData([]);
        return;
      }

      const { data: disputes, error } = await supabase
        .from('disputes')
        .select(`
          *,
          order:orders!disputes_order_id_fkey(
            id,
            amount,
            payment_token,
            client_address,
            provider_address,
            gig:gigs(
              id,
              title,
              provider:users!gigs_provider_id_fkey(
                id,
                username,
                avatar_url,
                full_name,
                wallet_address
              )
            ),
            client:users!orders_client_id_fkey(
              id,
              username,
              avatar_url,
              full_name,
              wallet_address
            )
          ),
          created_by_user:users!disputes_created_by_fkey(
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(disputes || []);
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchDisputes
  };
};

export const useResolveDispute = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();
  const { network } = useGetNetworkConfig();
  const { user } = useAuth();

  const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';

  // Helper function to convert UUID to hex
  const uuidToHex = (uuid: string): string => {
    const cleanUuid = uuid.replace(/-/g, '');
    if (cleanUuid.length !== 32) {
      throw new Error('Invalid UUID format, must have 32 hex characters without hyphens');
    }
    return cleanUuid;
  };

  const mutateAsync = async ({ 
    disputeId, 
    orderId, 
    refundToClient 
  }: { 
    disputeId: string; 
    orderId: string; 
    refundToClient: boolean 
  }) => {
    setIsLoading(true);
    try {
      if (!address || !user?.is_admin) {
        throw new Error('Admin privileges required');
      }

      // Convert order ID to hex format for smart contract
      const hexOrderId = uuidToHex(orderId);
      const refundFlag = refundToClient ? '01' : '00';

      // Create resolve dispute transaction
      const transaction = new Transaction({
        value: BigInt(0),
        data: Buffer.from(`resolveDispute@${hexOrderId}@${refundFlag}`),
        receiver: new Address(ESCROW_ADDRESS),
        gasLimit: BigInt(20000000),
        sender: new Address(address),
        chainID: network.chainId
      });

      console.log('Creating resolveDispute transaction:', { 
        disputeId, 
        orderId, 
        hexOrderId, 
        refundToClient, 
        refundFlag, 
        escrowAddress: ESCROW_ADDRESS 
      });

      // Sign and send transaction
      const sessionId = await signAndSendTransactions({
        transactions: [transaction],
        transactionsDisplayInfo: {
          processingMessage: 'Resolving dispute...',
          errorMessage: 'Dispute resolution failed',
          successMessage: 'Dispute successfully resolved'
        }
      });

      console.log('Dispute resolved, session ID:', sessionId);

      // Update dispute status in database
      const { error: disputeUpdateError } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId);

      if (disputeUpdateError) {
        console.error('Error updating dispute:', disputeUpdateError);
        throw new Error(`Database update failed: ${disputeUpdateError.message}`);
      }

      // Update order status in database
      const newOrderStatus = refundToClient ? 'cancelled' : 'completed';
      const newPaymentStatus = 'resolved';

      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          status: newOrderStatus,
          payment_status: newPaymentStatus,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error('Error updating order:', orderUpdateError);
        throw new Error(`Order update failed: ${orderUpdateError.message}`);
      }

      // Get order details for notifications
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          gig:gigs(title),
          client:users!orders_client_id_fkey(id, username),
          provider:gigs(provider:users!gigs_provider_id_fkey(id, username))
        `)
        .eq('id', orderId)
        .single();

      if (order) {
        // Send notifications to both parties
        const resolutionMessage = refundToClient 
          ? 'The dispute has been resolved in your favor. Your payment has been refunded.'
          : 'The dispute has been resolved in favor of the provider. Payment has been released.';

        // Notify client
        await supabase.from('notifications').insert({
          user_id: order.client.id,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          content: resolutionMessage,
          data: { order_id: orderId, refund_to_client: refundToClient },
          read: false
        });

        // Notify provider (get provider ID from gig)
        const { data: gig } = await supabase
          .from('gigs')
          .select('provider_id')
          .eq('id', order.gig_id)
          .single();

        if (gig) {
          await supabase.from('notifications').insert({
            user_id: gig.provider_id,
            type: 'dispute_resolved',
            title: 'Dispute Resolved',
            content: resolutionMessage,
            data: { order_id: orderId, refund_to_client: refundToClient },
            read: false
          });
        }

        // Add system message to chat
        await supabase.from('messages').insert({
          order_id: orderId,
          sender_id: user.id,
          content: JSON.stringify({
            type: 'dispute_resolved_admin',
            message: `🏛️ Dispute resolved by administration. ${refundToClient ? 'Payment refunded to client.' : 'Payment released to provider.'}`
          }),
          attachments: []
        });
      }

      return sessionId;
    } catch (error) {
      console.error('Error resolving dispute:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};