import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useGetAccount } from '../lib';

export type ClientRequestInput = {
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  category: string;
  requirements?: any;
  skills_needed?: string[];
};

export const useClientRequests = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchClientRequests();
  }, []);

  const fetchClientRequests = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all open client requests
      const { data: requests, error } = await supabase
        .from('client_requests')
        .select(`
          *,
          client:users!client_requests_client_id_fkey(
            id,
            username,
            avatar_url
          ),
          proposals!proposals_request_id_fkey(
            id,
            status,
            provider:users!proposals_provider_id_fkey(
              id,
              username,
              avatar_url
            )
          )
        `)
        .in('status', ['open', 'in_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(requests || []);
    } catch (err) {
      console.error('Error fetching client requests:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchClientRequests
  };
};

export const useCreateClientRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();

  const mutateAsync = async (input: ClientRequestInput) => {
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }

      // Get current user by wallet address
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (!user) {
        throw new Error('User not found. Please complete your profile first.');
      }

      // Create the client request
      const { data: request, error } = await supabase
        .from('client_requests')
        .insert({
          title: input.title,
          description: input.description,
          budget_min: input.budget_min,
          budget_max: input.budget_max,
          deadline: input.deadline,
          category: input.category,
          skills_needed: input.skills_needed || [],
          client_id: user.id,
          status: 'open',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (error) throw error;

      return request;
    } catch (error) {
      console.error('Error creating client request:', error);
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

export const useUpdateClientRequest = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (input: ClientRequestInput & { id: string }) => {
    setIsLoading(true);
    try {
      const { data: request, error } = await supabase
        .from('client_requests')
        .update({
          title: input.title,
          description: input.description,
          budget_min: input.budget_min,
          budget_max: input.budget_max,
          deadline: input.deadline,
          category: input.category,
          skills_needed: input.skills_needed || []
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;

      return request;
    } catch (error) {
      console.error('Error updating client request:', error);
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

export const useClientRequestById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchClientRequest = async () => {
      try {
        setIsLoading(true);
        
        const { data: request, error } = await supabase
          .from('client_requests')
          .select(`
            *,
            client:users!client_requests_client_id_fkey(
              id,
              username,
              full_name,
              avatar_url,
              created_at
            ),
            proposals(
              *,
              provider:users!proposals_provider_id_fkey(
                id,
                username,
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setData(request);
      } catch (err) {
        console.error('Error fetching client request:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientRequest();
  }, [id]);

  const refetch = async () => {
    // Refetch logic here
  };

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

export const useMyClientRequests = () => {
  return useClientRequests(); // Same as useClientRequests
};

export const useDeleteClientRequest = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (requestId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('client_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      return requestId;
    } catch (error) {
      console.error('Error deleting client request:', error);
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

export const useSelectProposal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<any>(null);

  const mutateAsync = async ({ requestId, proposalId }: { requestId: string; proposalId: string }) => {
    setIsLoading(true);
    setVariables({ requestId, proposalId });
    try {
      // Call the create_order_from_proposal function
      const { data, error } = await supabase.rpc('create_order_from_proposal', {
        proposal_id: proposalId
      });

      if (error) throw error;

      return { requestId, proposalId, orderId: data };
    } catch (error) {
      console.error('Error selecting proposal:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setVariables(null);
    }
  };

  return {
    mutateAsync,
    isLoading,
    variables
  };
};