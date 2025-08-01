import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export type GigInput = {
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  media_urls?: any;
  payment_token?: string;
  status?: string;
};

export const useGigs = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchGigs();
  }, [user?.id]);

  const fetchGigs = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        setData([]);
        return;
      }

      // Fetch gigs for current user
      const { data: gigs, error } = await supabase
        .from('gigs')
        .select(`
          *,
          provider:users!gigs_provider_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(gigs || []);
    } catch (err) {
      console.error('Error fetching gigs:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchGigs
  };
};

export const useAllGigs = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAllGigs();
  }, []);

  const fetchAllGigs = async () => {
    try {
      setIsLoading(true);
      
      const { data: gigs, error } = await supabase
        .from('gigs')
        .select(`
          *,
          provider:users!gigs_provider_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(gigs || []);
    } catch (err) {
      console.error('Error fetching all gigs:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchAllGigs
  };
};
export const useCreateGig = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async (input: GigInput) => {
    setIsLoading(true);
    try {
      if (!user) {
        throw new Error('Please connect your wallet first');
      }

      // Create the gig
      const { data: gig, error } = await supabase
        .from('gigs')
        .insert({
          title: input.title,
          description: input.description,
          price: input.price,
          duration: input.duration,
          category: input.category,
          provider_id: user.id,
          payment_token: input.payment_token || 'EGLD',
          status: input.status || 'active'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Gig created successfully:', gig);
      return gig;
    } catch (error) {
      console.error('Error creating gig:', error);
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

export const useUpdateGig = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (input: GigInput & { id: string }) => {
    setIsLoading(true);
    try {
      const { data: gig, error } = await supabase
        .from('gigs')
        .update({
          title: input.title,
          description: input.description,
          price: input.price,
          duration: input.duration,
          category: input.category,
          payment_token: input.payment_token || 'EGLD',
          status: input.status || 'active'
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Gig updated successfully:', gig);
      return gig;
    } catch (error) {
      console.error('Error updating gig:', error);
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

export const useUpdateGigStatus = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ id, status }: { id: string; status: string }) => {
    setIsLoading(true);
    try {
      const { data: gig, error } = await supabase
        .from('gigs')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('Gig status updated successfully:', gig);
      return gig;
    } catch (error) {
      console.error('Error updating gig status:', error);
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

export const useDeleteGig = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (gigId: string, options?: { onSuccess?: () => void }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('gigs')
        .delete()
        .eq('id', gigId);

      if (error) throw error;

      console.log('Gig deleted successfully');
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return gigId;
    } catch (error) {
      console.error('Error deleting gig:', error);
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

export const useGigById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchGig = async () => {
      try {
        setIsLoading(true);
        
        const { data: gig, error } = await supabase
          .from('gigs')
          .select(`
            *,
            provider:users!gigs_provider_id_fkey(
              id,
              username,
              full_name,
              avatar_url,
              bio,
              created_at
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setData(gig);
      } catch (err) {
        console.error('Error fetching gig:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGig();
  }, [id]);

  return {
    data,
    isLoading,
    error
  };
};