import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';

export const useMyProposals = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  useEffect(() => {
    fetchProposals();
  }, [address, isLoggedIn]);

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      
      if (!isLoggedIn || !address) {
        setData([]);
        return;
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

      if (!user) {
        setData([]);
        return;
      }

      const { data: proposals, error } = await supabase
        .from('proposals')
        .select(`
          *,
          provider:users!proposals_provider_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          request:client_requests!proposals_request_id_fkey(
            id,
            title,
            status,
            client:users!client_requests_client_id_fkey(
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(proposals || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchProposals
  };
};

export const useCreateProposal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();

  const mutateAsync = async (proposalData: {
    request_id: string;
    title: string;
    description: string;
    proposed_amount: number;
    proposed_duration: number;
    payment_token: string;
    deliverables: string[];
  }) => {
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

      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert({
          request_id: proposalData.request_id,
          provider_id: user.id,
          title: proposalData.title,
          description: proposalData.description,
          proposed_amount: proposalData.proposed_amount,
          proposed_duration: proposalData.proposed_duration,
          payment_token: proposalData.payment_token,
          deliverables: proposalData.deliverables,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Proposal created successfully:', proposal);
      return proposal;
    } catch (error) {
      console.error('Error creating proposal:', error);
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

export const useWithdrawProposal = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ id, requestId }: { id: string; requestId: string }) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'withdrawn' })
        .eq('id', id);

      if (error) throw error;

      console.log('Proposal withdrawn successfully:', { id, requestId });
      return { id, requestId };
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
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

export const useProposalById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchProposal();
  }, [id]);

  const fetchProposal = async () => {
    try {
      setIsLoading(true);
      
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select(`
          *,
          provider:users!proposals_provider_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          request:client_requests!proposals_request_id_fkey(
            id,
            title,
            status,
            client:users!client_requests_client_id_fkey(
              id,
              username,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setData(proposal);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = fetchProposal;

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

export const useSendProposalMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();

  const mutateAsync = async (messageData: {
    proposalId: string;
    content: string;
    attachments?: any[];
  }) => {
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

      const { data: message, error } = await supabase
        .from('proposal_messages')
        .insert({
          proposal_id: messageData.proposalId,
          sender_id: user.id,
          content: messageData.content,
          attachments: messageData.attachments || []
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Proposal message sent successfully:', message);
      return message;
    } catch (error) {
      console.error('Error sending proposal message:', error);
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