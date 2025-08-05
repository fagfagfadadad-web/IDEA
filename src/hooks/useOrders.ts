import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';
import { Address } from '@multiversx/sdk-core';

export const sendNotification = async ({ user_id, type, title, content, data }: {
  user_id: string;
  type: string;
  title: string;
  content: string;
  data?: any;
}) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content,
        data: data || {},
        read: false
      });

    if (error) throw error;
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const useOrders = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  useEffect(() => {
    fetchOrders();
  }, [address, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      if (!isLoggedIn || !address) {
        console.log('🔍 useOrders: Not logged in or no address:', { isLoggedIn, address });
        setData([]);
        return;
      }

      console.log('🔍 useOrders: Fetching orders for address:', address);

      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      console.log('🔍 useOrders: Found user:', user);

      if (!user) {
        console.log('🔍 useOrders: No user found for address:', address);
        setData([]);
        return;
      }

      const filterQuery = `client_id.eq.${user.id},provider_address.eq.${address}`;
      console.log('🔍 useOrders: Using filter query:', filterQuery);

      // Get all orders where user is either client or provider (by wallet address)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          gig:gigs(
            title,
            provider:users!gigs_provider_id_fkey(username, avatar_url, wallet_address)
          ),
          client:users!orders_client_id_fkey(username, avatar_url, wallet_address),
          reviews(*)
        `)
        .or(filterQuery)
        .order('created_at', { ascending: false });

      console.log('🔍 useOrders: Query result:', { orders, error });
      console.log('🔍 useOrders: Orders count:', orders?.length || 0);
      console.log('🔍 useOrders: First few orders:', orders?.slice(0, 3));
      orders?.forEach(order => {
        console.log(`🔍 useOrders: Order ID: ${order.id}, Gig Provider ID: ${order.gig?.provider?.id}, Current User ID: ${user.id}`);
      });

      if (error) throw error;

      setData(orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchOrders
  };
};

export const useCreateOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();

  const mutateAsync = async (orderData: { 
    gig_id: string; 
    amount: number;
    requirements?: any;
    deadline?: string;
    payment_token?: string;
  }) => {
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      if (!user) {
        throw new Error('User not found. Please complete your profile first.');
      }

      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('provider_id, payment_token, users!provider_id(wallet_address)')
        .eq('id', orderData.gig_id)
        .single();

      if (gigError) {
        console.error('Error fetching gig:', gigError);
        throw new Error(`Failed to fetch gig: ${gigError.message}`);
      }

      const providerAddress = gig?.users?.wallet_address;
      if (!providerAddress || !isValidAddress(providerAddress)) {
        console.error('Invalid or missing provider address for gig:', { gigId: orderData.gig_id, providerAddress });
        throw new Error('Provider address not found or invalid for gig');
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          gig_id: orderData.gig_id,
          client_id: user.id,
          amount: orderData.amount,
          requirements: orderData.requirements || {},
          deadline: orderData.deadline,
          payment_token: gig.payment_token || 'EGLD',
          status: 'pending_approval',
          payment_status: 'pending',
          work_status: 'pending',
          client_address: address,
          provider_address: providerAddress
        })
        .select(`
          *,
          gig:gigs(title),
          client:users!orders_client_id_fkey(username, email)
        `)
        .single();

      if (error) throw error;

      console.log('Order created successfully:', JSON.stringify(order, null, 2));
      return order;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isValidAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    try {
      new Address(addr);
      return true;
    } catch {
      return false;
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};

export const useOrderById = (orderId: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            client:users!orders_client_id_fkey(id, username, avatar_url, full_name),
            gig:gigs!orders_gig_id_fkey(
              id, 
              title, 
              provider_id,
              provider:users!gigs_provider_id_fkey(id, username, avatar_url, full_name, wallet_address)
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('Supabase error fetching order:', error);
          throw new Error(`Failed to fetch order: ${error.message}`);
        }

        if (!order) throw new Error('Order not found');
        console.log('Fetched order data:', JSON.stringify(order, null, 2));
        setData(order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return {
    data,
    isLoading,
    error
  };
};

export const useUpdateOrderStatus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ orderId, status, amount }: { orderId: string; status: string; amount?: number }) => {
    setIsLoading(true);
    try {
      const updateData: any = { 
        status,
        status_updated_at: new Date().toISOString()
      };
      
      if (amount !== undefined) {
        updateData.amount = amount;
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      console.log('Order status updated successfully:', order);
      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
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