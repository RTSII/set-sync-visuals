
import React, { useState, useEffect } from 'react';
import { Header } from "@/components/Header";
import { MediaLibrary } from "@/components/MediaLibrary";
import { Timeline } from "@/components/Timeline";
import { VideoPreview } from "@/components/VideoPreview";
import { WorkflowTutorial } from "@/components/WorkflowTutorial";
import { EditorProvider } from "@/context/EditorContext";
import ProjectDashboard from "@/components/ProjectDashboard";
import { useProjects, Project } from "@/hooks/useProjects";
import { useEditorStore } from "@/lib/store";
import { toast } from 'sonner';

const Index = () => {
  const [showProjects, setShowProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('Untitled Project');
  const { saveProject } = useProjects();
  const { clips, audioUrl, duration } = useEditorStore();

  const handleNewProject = () => {
    // Reset the editor state for a new project
    useEditorStore.getState().clearTimeline();
    setCurrentProjectId(null);
    setCurrentProjectName('Untitled Project');
    setShowProjects(false);
    toast.success('New project created');
  };

  const handleLoadProject = (project: Project) => {
    try {
      // Load project data into the editor
      if (project.timeline_data?.clips) {
        useEditorStore.getState().loadProject(project.timeline_data.clips);
      }
      if (project.timeline_data?.audioUrl) {
        useEditorStore.getState().setAudioUrl(project.timeline_data.audioUrl);
      }
      
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setShowProjects(false);
      
      console.log('Project loaded:', project.name, 'with', project.timeline_data?.clips?.length || 0, 'clips');
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    }
  };

  const handleSaveProject = async (name?: string) => {
    const projectName = name || currentProjectName;
    const timelineData = {
      clips,
      audioUrl,
      duration
    };

    console.log('Saving project:', projectName, 'with', clips.length, 'clips');
    
    const savedProject = await saveProject(projectName, timelineData, currentProjectId || undefined);
    
    if (savedProject) {
      setCurrentProjectId(savedProject.id);
      setCurrentProjectName(savedProject.name);
    }
  };

  if (showProjects) {
    return (
      <ProjectDashboard
        onNewProject={handleNewProject}
        onLoadProject={handleLoadProject}
      />
    );
  }

  return (
    <EditorProvider>
      <div className="min-h-screen bg-slate-900 text-white">
        <Header 
          onShowProjects={() => setShowProjects(true)}
          onSaveProject={handleSaveProject}
          currentProjectName={currentProjectName}
          onProjectNameChange={setCurrentProjectName}
        />
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-80 border-r border-slate-700 flex flex-col">
            <MediaLibrary />
            <WorkflowTutorial />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <VideoPreview />
            </div>
            <div className="h-64">
              <Timeline />
            </div>
          </div>
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;
