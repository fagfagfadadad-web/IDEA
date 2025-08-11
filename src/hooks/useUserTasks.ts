import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export type UserTask = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  project_id?: string;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  project_id?: string;
};

export const useUserTasks = () => {
  const [data, setData] = useState<UserTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [user?.id]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        setData([]);
        return;
      }

      const { data: tasks, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setData(tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchTasks
  };
};

export const useCreateTask = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const mutateAsync = async (input: TaskInput) => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        throw new Error('Please log in to create tasks');
      }

      const { data: task, error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          due_date: input.due_date,
          priority: input.priority || 'medium',
          project_id: input.project_id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return task;
    } catch (error) {
      console.error('Error creating task:', error);
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

export const useUpdateTask = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ 
    id, 
    updates 
  }: { 
    id: string; 
    updates: Partial<TaskInput & { status: 'pending' | 'completed' | 'cancelled' }>
  }) => {
    setIsLoading(true);
    try {
      const { data: task, error } = await supabase
        .from('user_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return task;
    } catch (error) {
      console.error('Error updating task:', error);
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

export const useDeleteTask = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async (taskId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      return taskId;
    } catch (error) {
      console.error('Error deleting task:', error);
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