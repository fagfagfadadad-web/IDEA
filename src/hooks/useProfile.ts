import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const useProfile = (id?: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, user } = useAuth();

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
          client_orders:orders!orders_client_id_fkey(
            *,
            gig:gigs(title, provider_id),
            client:users!orders_client_id_fkey(id, username, avatar_url, full_name),
            reviews(*)
          )
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
      
      console.log('🔍 useProfile: Fetched user profile with client orders:', profile);
      console.log('🔍 useProfile: Client orders count:', profile?.client_orders?.length || 0);
      profile?.client_orders?.forEach((order, index) => {
        console.log(`🔍 Client Order ${index}:`, {
          orderId: order.id,
          clientData: order.client,
          hasClient: !!order.client,
          clientUsername: order.client?.username,
          clientFullName: order.client?.full_name,
          reviewsCount: order.reviews?.length || 0
        });
        order.reviews?.forEach((review, reviewIndex) => {
          console.log(`🔍 Order Review ${reviewIndex}:`, {
            reviewId: review.id,
            rating: review.rating,
            comment: review.comment
          });
        });
      });

      // Fetch provider orders separately
      const { data: providerOrders, error: providerOrdersError } = await supabase
        .from('orders')
        .select(`
          *,
          gig:gigs(title, provider_id),
          client:users!orders_client_id_fkey(id, username, avatar_url, full_name),
          reviews(*)
        `)
        .eq('provider_address', user.wallet_address || '')
        .order('created_at', { ascending: false });

      if (providerOrdersError) {
        console.error('Error fetching provider orders:', providerOrdersError);
      }

      console.log('🔍 useProfile: Fetched provider orders:', providerOrders);
      console.log('🔍 useProfile: Provider orders count:', providerOrders?.length || 0);
      providerOrders?.forEach((order, index) => {
        console.log(`🔍 Provider Order ${index}:`, {
          orderId: order.id,
          clientData: order.client,
          hasClient: !!order.client,
          clientUsername: order.client?.username,
          clientFullName: order.client?.full_name,
          reviewsCount: order.reviews?.length || 0
        });
      });

      // Combine all orders and remove duplicates
      const allOrders = [
        ...(profile?.client_orders || []),
        ...(providerOrders || [])
      ];
      
      // Remove duplicates based on order ID
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      // Sort by created_at descending
      uniqueOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Add combined orders to profile
      const enhancedProfile = {
        ...profile,
        orders: uniqueOrders,
        // Add separate arrays for different types of reviews
        reviewsWritten: uniqueOrders
          .filter(order => order.client?.id === user.id && order.reviews?.length > 0)
          .flatMap(order => order.reviews.map(review => ({
            ...review,
            order: {
              ...order,
              gig: order.gig
            }
          }))),
        reviewsReceived: uniqueOrders
          .filter(order => order.gig?.provider_id === user.id && order.reviews?.length > 0)
          .flatMap(order => order.reviews.map(review => ({
            ...review,
            order: {
              ...order,
              client: order.client
            }
          })))
      };
      
      console.log('🔍 useProfile: Enhanced profile with separated reviews:', {
        userId: user.id,
        totalOrders: uniqueOrders.length,
        reviewsWritten: enhancedProfile.reviewsWritten.length,
        reviewsReceived: enhancedProfile.reviewsReceived.length,
        reviewsWrittenData: enhancedProfile.reviewsWritten,
        reviewsReceivedData: enhancedProfile.reviewsReceived
      });
      
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