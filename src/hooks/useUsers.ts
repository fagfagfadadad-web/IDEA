import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const useUsers = (searchTerm = '', page = 1, pageSize = 10) => {
  const [data, setData] = useState<{ data: any[]; count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, page, pageSize, user?.id]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.is_admin) {
        setData({ data: [], count: 0 });
        return;
      }

      let query = supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          email,
          wallet_address,
          avatar_url,
          created_at,
          is_admin,
          is_banned,
          bio
        `, { count: 'exact' });

      // Apply search filter if provided
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,wallet_address.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at descending
      query = query.order('created_at', { ascending: false });

      const { data: users, error, count } = await query;

      if (error) throw error;

      setData({ data: users || [], count: count || 0 });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = fetchUsers;

  return {
    data,
    isLoading,
    error,
    refetch
  };
};

export const useUpdateUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async ({ 
    userId, 
    updates 
  }: { 
    userId: string; 
    updates: {
      username?: string;
      full_name?: string;
      email?: string;
      is_admin?: boolean;
      is_banned?: boolean;
    }
  }) => {
    setIsLoading(true);
    try {
      if (!user?.is_admin) {
        throw new Error('Admin privileges required');
      }

      // Prevent admin from removing their own admin status
      if (userId === user.id && updates.is_admin === false) {
        throw new Error('You cannot remove your own admin privileges');
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
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

export const useAdminStats = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.is_admin) {
        setData(null);
        setError(null);
        return;
      }

      
      const { data: stats, error } = await supabase
        .from('admin_stats')
        .select('*')
        .maybeSingle();

      if (error) {
        // Handle PGRST116 error specifically - treat as no data found
        if (error.code === 'PGRST116' && error.details === 'The result contains 0 rows') {
          setData(null);
          setError(null);
          return;
        }
        
        throw error;
      }

      setData(stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats
  };
};