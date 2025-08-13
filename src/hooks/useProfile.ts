import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const useProfile = (id?: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    fetchProfile();
  }, [id, user?.id, isAuthenticated]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // For viewing other users' profiles, we don't need authentication
      if (id) {
        // Fetching someone else's public profile
        const { data: profile, error } = await supabase
          .from('users')
          .select(`
            id,
            username,
            full_name,
            avatar_url,
            bio,
            created_at,
            twitter_url,
            github_url,
            linkedin_url,
            website_url
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('Profile not found (PGRST116), treating as no profile');
            setData(null);
            setError(null);
            return;
          }
          throw error;
        }
        setData(profile);
        return;
      }

      // For own profile, require authentication
      if (!isAuthenticated || !user) {
        setData(null);
        setIsLoading(false);
        return;
      }

      // Fetching own profile with full data
      const { data: profile, error } = await supabase
        .from('users')
        .select(`
          *,
          gigs(*),
          client_orders:orders!orders_client_id_fkey(*)
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Profile not found (PGRST116), treating as no profile');
          setData(null);
          setError(null);
          return;
        }
        throw error;
      }
      

      // Fetch reviews received by this user as a provider
      // First get all orders where this user is the provider
      const { data: providerOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          gig_id,
          client:users!orders_client_id_fkey(id, username, avatar_url, full_name),
          gig:gigs(
            id,
            title,
            provider_id,
            provider:users!gigs_provider_id_fkey(id, username, avatar_url, full_name)
          ),
          reviews(*)
        `)
        .in('gig_id', 
          await supabase
            .from('gigs')
            .select('id')
            .eq('provider_id', user.id)
            .then(({ data }) => data?.map(g => g.id) || [])
        )
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching provider orders:', ordersError);
      }

      
      // Extract reviews from provider orders
      const receivedReviews = (providerOrders || [])
        .filter(order => order.reviews && order.reviews.length > 0)
        .flatMap(order => 
          order.reviews.map(review => ({
            ...review,
            order: {
              id: order.id,
              gig_id: order.gig_id,
              client: order.client,
              gig: order.gig
            }
          }))
        );


      // Fetch all orders for this user (both as client and provider)
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          created_at,
          gig:gigs(title, provider_id, provider:users!gigs_provider_id_fkey(username, avatar_url)),
          client:users!orders_client_id_fkey(id, username, avatar_url, full_name),
          reviews(*)
        `)
        .or(`client_id.eq.${user.id},provider_address.eq.${user.wallet_address || ''}`)
        .order('created_at', { ascending: false });

      if (allOrdersError) {
        console.error('Error fetching orders:', allOrdersError);
      }

      // Add combined orders to profile
      const enhancedProfile = {
        ...profile,
        orders: allOrders || [],
        received_reviews: receivedReviews || [] // Reviews received as provider
      };
      
      setData(enhancedProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = fetchProfile;

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

export const useUpdateProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async (profileData: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    email?: string;
    email_notifications_enabled?: boolean;
    twitter_url?: string;
    github_url?: string;
    linkedin_url?: string;
    website_url?: string;
  }) => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error('User ID is required for profile update');
      }

      const { data: updatedProfile, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
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