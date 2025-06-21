
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TimelineClip } from '@/types';
import { toast } from 'sonner';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  timeline_data?: {
    clips: TimelineClip[];
    audioUrl?: string;
    duration?: number;
  };
  audio_url?: string;
  waveform_data?: any;
  duration?: number;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async (
    name: string,
    timelineData: { clips: TimelineClip[]; audioUrl?: string; duration?: number },
    projectId?: string
  ) => {
    if (!user) {
      toast.error('Please sign in to save projects');
      return null;
    }

    try {
      const projectData = {
        name,
        timeline_data: timelineData,
        audio_url: timelineData.audioUrl,
        duration: timelineData.duration,
        user_id: user.id
      };

      let result;
      if (projectId) {
        // Update existing project
        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Project updated successfully!');
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        toast.success('Project saved successfully!');
      }

      await fetchProjects(); // Refresh the projects list
      return result;
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
      return null;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Project deleted successfully!');
      await fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const loadProject = async (projectId: string): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [user]);

  return {
    projects,
    loading,
    saveProject,
    deleteProject,
    loadProject,
    fetchProjects
  };
};
