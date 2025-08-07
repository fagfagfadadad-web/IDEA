import { useState, useEffect } from 'react';
import { useGetAccount, useGetIsLoggedIn } from 'lib';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useReviewsByGig = (gigId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gigId) return;

    fetchReviews();
  }, [gigId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      
      // Get provider_id for this gig first
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('provider_id')
        .eq('id', gigId)
        .single();

      if (gigError) throw gigError;
      if (!gig) {
        console.log('🔍 useReviewsByGig: Gig not found:', gigId);
        setData([]);
        return;
      }

      console.log('🔍 useReviewsByGig: Found gig provider_id:', gig.provider_id);

      // Get reviews for this provider from orders related to this gig
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          order:orders(
            id,
            gig_id,
            client:users!orders_client_id_fkey(id, username, avatar_url, full_name)
          ),
          provider:users!reviews_provider_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq('provider_id', gig.provider_id)
        .eq('order.gig_id', gigId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('🔍 useReviewsByGig: Fetched reviews data:', reviews);
      console.log('🔍 useReviewsByGig: Reviews count:', reviews?.length || 0);
      reviews?.forEach((review, index) => {
        console.log(`🔍 Review ${index}:`, {
          reviewId: review.id,
          orderId: review.order_id,
          clientData: review.order?.client,
          hasClient: !!review.order?.client,
          clientUsername: review.order?.client?.username,
          clientFullName: review.order?.client?.full_name,
          providerId: review.provider_id,
          providerUsername: review.provider?.username
        });
      });

      setData(reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchReviews
  };
};

export const useOrderReview = (orderId: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetchReview();
  }, [orderId]);

  const fetchReview = async () => {
    try {
      setIsLoading(true);
      
      const { data: review, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setData(review);
    } catch (err) {
      console.error('Error fetching review:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchReview
  };
};

export const useCreateReview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async (reviewData: {
    order_id: string;
    rating: number;
    comment: string;
  }) => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error('Please connect your wallet first');
      }

      // Get provider_id from the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          client_id,
          gig:gigs(provider_id)
        `)
        .eq('id', reviewData.order_id)
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Order not found');
      if (order.client_id !== user.id) throw new Error('Only the client can review this order');

      const providerId = order.gig?.provider_id;
      if (!providerId) throw new Error('Provider not found for this order');

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', reviewData.order_id)
        .maybeSingle();

      let review;
      if (existingReview) {
        // Update existing review
        const { data: updatedReview, error } = await supabase
          .from('reviews')
          .update({
            rating: reviewData.rating,
            comment: reviewData.comment,
            provider_id: providerId
          })
          .eq('order_id', reviewData.order_id)
          .select()
          .single();

        if (error) throw error;
        review = updatedReview;
      } else {
        // Create new review
        const { data: newReview, error } = await supabase
          .from('reviews')
          .insert({
            order_id: reviewData.order_id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            provider_id: providerId
          })
          .select()
          .single();

        if (error) throw error;
        review = newReview;
      }

      return review;
    } catch (error) {
      console.error('Error creating review:', error);
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

export const useReviewsForProvider = (providerId: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!providerId) return;

    fetchProviderReviews();
  }, [providerId]);

  const fetchProviderReviews = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 useReviewsForProvider: Fetching reviews for provider:', providerId);

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          order:orders(
            id,
            gig_id,
            client:users!orders_client_id_fkey(id, username, avatar_url, full_name)
          ),
          provider:users!reviews_provider_id_fkey(id, username, avatar_url, full_name)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('🔍 useReviewsForProvider: Fetched provider reviews data:', reviews);
      console.log('🔍 useReviewsForProvider: Reviews count:', reviews?.length || 0);
      reviews?.forEach((review, index) => {
        console.log(`🔍 Provider Review ${index}:`, {
          reviewId: review.id,
          orderId: review.order_id,
          clientData: review.order?.client,
          hasClient: !!review.order?.client,
          clientUsername: review.order?.client?.username,
          clientFullName: review.order?.client?.full_name,
          providerId: review.provider_id,
          providerUsername: review.provider?.username
        });
      });

      setData(reviews || []);
    } catch (err) {
      console.error('Error fetching provider reviews:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = fetchProviderReviews;

  return {
    data,
    isLoading,
    error,
    refetch
  };
};