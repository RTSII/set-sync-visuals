
import React, { createContext, useState, useContext, ReactNode } from 'react';

// This type will be shared between components
export type MediaClip = {
  id: string;
  src: string;
  file: File;
};

interface EditorContextType {
  timelineClips: MediaClip[];
  addClipToTimeline: (clip: MediaClip) => void;
  setTimelineClips: React.Dispatch<React.SetStateAction<MediaClip[]>>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [timelineClips, setTimelineClips] = useState<MediaClip[]>([]);

  const addClipToTimeline = (clip: MediaClip) => {
    // Avoid adding duplicate clips to the timeline
    if (!timelineClips.find(c => c.id === clip.id)) {
      setTimelineClips(prevClips => [...prevClips, clip]);
    }
  };

  const value = {
    timelineClips,
    addClipToTimeline,
    setTimelineClips
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
