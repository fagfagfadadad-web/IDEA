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
      
      if (!isAuthenticated || !user) {
        setData(null);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('users')
        .select(`
          *,
          gigs(*),
          orders:orders!orders_client_id_fkey(
            *,
            gig:gigs(title, provider_id),
            client:users!orders_client_id_fkey(username, avatar_url),
            reviews(*)
          )
        `);

      if (id) {
        const { data: profile, error } = await query.eq('id', id).maybeSingle();
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
      } else {
        const { data: profile, error } = await query.eq('id', user.id).maybeSingle();
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
      }
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

      console.log('Profile updated successfully');
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