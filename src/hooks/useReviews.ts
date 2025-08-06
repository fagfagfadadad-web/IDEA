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
      
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          order:orders!reviews_order_id_fkey(
            id,
            gig_id,
            client:users!orders_client_id_fkey(username, avatar_url),
            gig:gigs(title)
          )
        `)
        .in('order.gig_id', [gigId])
        .order('created_at', { ascending: false });

      if (error) throw error;

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
            comment: reviewData.comment
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
            comment: reviewData.comment
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
      
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          *,
          order:orders!reviews_order_id_fkey(
            id,
            gig_id,
            client:users!orders_client_id_fkey(username, avatar_url),
            gig:gigs!orders_gig_id_fkey(
              id,
              title,
              provider_id
            )
          )
        `)
        .in('order.gig.provider_id', [providerId])
        .order('created_at', { ascending: false });

      if (error) throw error;

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