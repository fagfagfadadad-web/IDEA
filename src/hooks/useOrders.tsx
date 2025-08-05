import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface GigWithProviderWallet {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  provider_id: string;
  created_at: string;
  media_urls: any;
  payment_token: string;
  status: string;
  view_count: number;
  provider: { wallet_address: string } | null;
}

interface OrderWithDetails {
  id: string;
  gig_id: string | null;
  client_id: string;
  status: string;
  amount: number;
  created_at: string;
  requirements: any;
  deadline: string | null;
  status_updated_at: string;
  transaction_hash: string | null;
  payment_status: string;
  release_at: string | null;
  work_status: string;
  client_address: string;
  provider_address: string;
  payment_token: string;
  gig?: GigWithProviderWallet;
  client?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export const useOrderById = (orderId: string) => {
  const [data, setData] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const { data: orderData, error } = await supabase
          .from('orders')
          .select(`
            *,
            gig:gigs(
              *,
              provider:users!provider_id(
                id,
                username,
                wallet_address,
                avatar_url
              )
            ),
            client:users!client_id(
              id,
              username,
              avatar_url
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setData(orderData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  return { data, isLoading, error };
};

export const useCreateOrder = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (orderData: {
    gigId: string;
    requirements: any;
    deadline?: string;
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      // First, get the gig details to validate provider address
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select(`
          *,
          provider:users!provider_id(wallet_address)
        `)
        .eq('id', orderData.gigId)
        .single();

      if (gigError) {
        console.error('Error fetching gig:', gigError);
        throw new Error(`Failed to fetch gig details: ${gigError.message}`);
      }

      if (!gig) {
        throw new Error('Gig not found');
      }

      console.log('Fetched gig for order creation:', { 
        gigId: orderData.gigId, 
        gig,
        provider: gig.provider,
        providerWalletAddress: gig.provider?.wallet_address
      });

      const providerAddress = gig?.provider?.wallet_address;

      if (!providerAddress || !isValidAddress(providerAddress)) {
        console.error('Invalid or missing provider address for gig:', { gigId: orderData.gigId });
        throw new Error('Invalid or missing provider address for gig');
      }

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          gig_id: orderData.gigId,
          client_id: user.id,
          status: 'pending_approval',
          amount: gig.price,
          requirements: orderData.requirements,
          deadline: orderData.deadline,
          payment_status: 'pending',
          work_status: 'pending',
          client_address: '',
          provider_address: providerAddress,
          payment_token: gig.payment_token || 'EGLD'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(`Error creating order: ${orderError.message}`);
      }

      console.log('Order created successfully:', order);
      return order;
    } catch (error) {
      console.error('Error in useCreateOrder:', error);
      if (error instanceof Error) {
        if (error.message.includes('provider address')) {
          throw new Error('Provider address not found or invalid for gig');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while creating order');
    } finally {
      setIsLoading(false);
    }
  };

  return { mutateAsync, isLoading };
};

const isValidAddress = (addr: string | undefined): boolean => {
  if (!addr) return false;
  try {
    // Basic validation for MultiversX address format
    return addr.startsWith('erd1') && addr.length === 62;
  } catch {
    return false;
  }
};