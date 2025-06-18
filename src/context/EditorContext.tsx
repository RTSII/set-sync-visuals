
import React, { createContext, useContext, ReactNode, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { MediaClip } from '@/types';
import { safeAddEventListener } from '@/lib/safeEventListeners';

export type { MediaClip };

interface EditorContextType {
  togglePlay: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  handleClipEnded: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    if (timelineClips.length > 0 && !selectedClip) {
      setSelectedClip(timelineClips[0]);
    }
  }, [timelineClips, selectedClip, setSelectedClip]);

  useEffect(() => {
    const video = videoRef.current;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const removePlayListener = safeAddEventListener(video, 'play', handlePlay);
    const removePauseListener = safeAddEventListener(video, 'pause', handlePause);

    return () => {
      removePlayListener();
      removePauseListener();
    };
  }, [setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video && audio && isPlaying && Math.abs(video.currentTime - audio.currentTime) > 0.2) {
      audio.currentTime = video.currentTime;
    }
  }, [currentTime, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video.paused) {
      if (selectedClip.originalDuration === 0 && video.duration > 0) {
        const updatedClip = {
          ...selectedClip,
          originalDuration: video.duration,
          endTime: video.duration
        };
        setSelectedClip(updatedClip);
      }

      video.play().catch(e => console.error("Video play error:", e));
      audio?.play().catch(e => console.error("Audio play error:", e));
    } else {
      video.pause();
      audio?.pause();
    }
  }, [selectedClip, setSelectedClip]);

  const jumpToStart = useCallback(() => {
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const clipStartTime = selectedClip.startTime ?? 0;

    video.currentTime = clipStartTime;
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.currentTime = clipStartTime;
    }
  }, [selectedClip, setCurrentTime]);

  const jumpToEnd = useCallback(() => {
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const clipEndTime = selectedClip.endTime ?? video.duration;
    const clipStartTime = selectedClip.startTime ?? 0;

    video.currentTime = clipEndTime;
    setCurrentTime(clipEndTime - clipStartTime);

    if (audioRef.current) {
      audioRef.current.currentTime = clipEndTime;
    }
  }, [selectedClip, setCurrentTime]);

  const handleClipEnded = useCallback(() => {
    if (!selectedClip || timelineClips.length === 0) return;

    const currentIndex = timelineClips.findIndex(c => c.id === selectedClip.id);

    if (currentIndex >= 0 && currentIndex < timelineClips.length - 1) {
      const nextClip = timelineClips[currentIndex + 1];
      setWasPlaying(isPlaying);
      setSelectedClip(nextClip);
    } else {
      const video = videoRef.current;
      const audio = audioRef.current;
      if (video) video.pause();
      if (audio) audio.pause();
      setIsPlaying(false);
    }
  }, [selectedClip, timelineClips, isPlaying, setWasPlaying, setSelectedClip, setIsPlaying]);

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
