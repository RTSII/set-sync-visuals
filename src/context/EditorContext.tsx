
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
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const clipStartTime = selectedClip.startTime ?? 0;
    
    video.currentTime = clipStartTime;
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = clipStartTime;
    }
  };

  const jumpToEnd = () => {
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const clipEndTime = selectedClip.endTime ?? video.duration;
    const clipStartTime = selectedClip.startTime ?? 0;
    
    video.currentTime = clipEndTime;
    setCurrentTime(clipEndTime - clipStartTime);
    
    if (audioRef.current) {
      audioRef.current.currentTime = clipEndTime;
    }
  };

  const handleClipEnded = () => {
    if (!selectedClip || timelineClips.length === 0) return;
    
    const currentIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    
    if (currentIndex >= 0 && currentIndex < timelineClips.length - 1) {
      // Move to next clip in sequence (left to right)
      const nextClip = timelineClips[currentIndex + 1];
      console.log(`Auto-advancing from clip ${currentIndex} to ${currentIndex + 1}`);
      setWasPlaying(isPlaying); // Remember if we were playing
      setSelectedClip(nextClip);
    } else {
      // Last clip or clip not found, stop playing
      console.log("Reached end of timeline, stopping playback");
      setIsPlaying(false);
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
