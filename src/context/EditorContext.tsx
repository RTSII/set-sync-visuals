
import React, { createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { MediaClip } from '@/types';

// This type will be shared between components
export type { MediaClip };

interface EditorContextType {
  // Playback actions that need refs
  togglePlay: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  handleClipEnded: () => void;
  
  // Media Element Refs
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get state and setters from Zustand store
  const {
    timelineClips,
    selectedClip,
    setSelectedClip,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    setWasPlaying,
    currentTime
  } = useEditorStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [setIsPlaying]);

  useEffect(() => {
    // Sync audio current time with video current time
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video && audio && isPlaying && Math.abs(video.currentTime - audio.currentTime) > 0.2) {
      audio.currentTime = video.currentTime;
    }
  }, [currentTime, isPlaying]);

  const togglePlay = () => {
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video.paused) {
      video.play().catch(e => console.error("Video play error:", e));
      audio?.play().catch(e => console.error("Audio play error:", e));
    } else {
      video.pause();
      audio?.pause();
    }
  };

  const jumpToStart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const jumpToEnd = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    }
  };

  const handleClipEnded = () => {
    if (!selectedClip) return;
    
    const currentIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    const isLastClip = currentIndex === timelineClips.length - 1;

    if (currentIndex > -1 && !isLastClip) {
        const nextClip = timelineClips[currentIndex + 1];
        if (nextClip) {
          setWasPlaying(true);
          setSelectedClip(nextClip);
        }
    }
  };

  const value = {
    togglePlay,
    jumpToStart,
    jumpToEnd,
    handleClipEnded,
    videoRef,
    audioRef,
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
