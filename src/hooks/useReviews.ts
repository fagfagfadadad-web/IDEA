import { useState, useEffect } from 'react';
import { useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';

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
            client:users!orders_client_id_fkey(username, avatar_url),
            gig:gigs(title)
          )
        `)
        .eq('order.gig_id', gigId)
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
        .single();

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
  const { address } = useGetAccount();

  const mutateAsync = async (reviewData: {
    order_id: string;
    rating: number;
    comment: string;
  }) => {
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }

      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          order_id: reviewData.order_id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Review created successfully:', review);
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