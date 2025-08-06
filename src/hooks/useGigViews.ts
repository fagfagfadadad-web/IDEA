import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Throttle tracking to prevent spam - store last track time per gig
const lastTrackTimes = new Map<string, number>();
const TRACK_THROTTLE_MS = 10 * 60 * 1000; // 10 minutes

export const useTrackGigView = () => {
  const [isLoading, setIsLoading] = useState(false);

  const trackView = async (gigId: string, userId?: string) => {
    // Check if we've tracked this gig recently
    const now = Date.now();
    const lastTrackTime = lastTrackTimes.get(gigId);
    
    if (lastTrackTime && (now - lastTrackTime) < TRACK_THROTTLE_MS) {
      console.log(`View tracking throttled for gig ${gigId} - last tracked ${Math.round((now - lastTrackTime) / 1000 / 60)} minutes ago`);
      return { success: true, throttled: true };
    }

    setIsLoading(true);
    try {
      // Get user's IP address (simplified - in production you might want a more robust solution)
      const getClientIP = async () => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          return data.ip;
        } catch {
          return 'unknown';
        }
      };

      const viewerIP = await getClientIP();
      const userAgent = navigator.userAgent;

      // Check if this IP/user combination has already viewed this gig in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: existingView } = await supabase
        .from('gig_views')
        .select('id')
        .eq('gig_id', gigId)
        .eq('viewer_ip', viewerIP)
        .gte('created_at', tenMinutesAgo)
        .maybeSingle();

      // If user is logged in, also check by user ID
      if (userId) {
        const { data: existingUserView } = await supabase
          .from('gig_views')
          .select('id')
          .eq('gig_id', gigId)
          .eq('viewer_id', userId)
          .gte('created_at', tenMinutesAgo)
          .maybeSingle();

        if (existingUserView) {
          console.log('User already viewed this gig in the last 10 minutes');
          return { success: true, alreadyViewed: true };
        }
      }

      if (existingView) {
        console.log(`IP already viewed gig ${gigId} in the last 10 minutes`);
        return { success: true, alreadyViewed: true };
      }

      // Record the new view
      const { error } = await supabase
        .from('gig_views')
        .insert({
          gig_id: gigId,
          viewer_ip: viewerIP,
          viewer_id: userId || null,
          user_agent: userAgent
        });

      if (error) {
        console.error(`Error tracking view for gig ${gigId}:`, error);
        return { success: false, error: error.message };
      }

      // Update throttle time only on successful track
      lastTrackTimes.set(gigId, now);
      console.log(`Gig view tracked successfully for ${gigId}`);
      return { success: true, alreadyViewed: false };
    } catch (error) {
      console.error(`Error tracking view for gig ${gigId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    trackView,
    isLoading
  };
};

export const useGigViewsStats = (gigId: string) => {
  const [data, setData] = useState<{
    totalViews: number;
    uniqueViewers: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!gigId) return;

    setIsLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get total views
      const { count: totalViews } = await supabase
        .from('gig_views')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gigId);

      // Get unique viewers (by IP)
      const { data: uniqueViewersData } = await supabase
        .from('gig_views')
        .select('viewer_ip')
        .eq('gig_id', gigId);

      const uniqueViewers = new Set(uniqueViewersData?.map(v => v.viewer_ip)).size;

      // Get views today
      const { count: viewsToday } = await supabase
        .from('gig_views')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gigId)
        .gte('created_at', today);

      // Get views this week
      const { count: viewsThisWeek } = await supabase
        .from('gig_views')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gigId)
        .gte('created_at', weekAgo);

      // Get views this month
      const { count: viewsThisMonth } = await supabase
        .from('gig_views')
        .select('*', { count: 'exact', head: true })
        .eq('gig_id', gigId)
        .gte('created_at', monthAgo);

      setData({
        totalViews: totalViews || 0,
        uniqueViewers,
        viewsToday: viewsToday || 0,
        viewsThisWeek: viewsThisWeek || 0,
        viewsThisMonth: viewsThisMonth || 0
      });
    } catch (err) {
      console.error('Error fetching gig views stats:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
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