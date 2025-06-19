
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
  seekToTime: (time: number) => void;
  seekToAbsoluteTime: (absoluteTime: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  getAbsoluteTimePosition: () => number;
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

  // Auto-select first clip when clips are added and reset to beginning
  useEffect(() => {
    if (timelineClips.length > 0 && !selectedClip) {
      console.log("Auto-selecting first clip and resetting to beginning");
      setSelectedClip(timelineClips[0]);
      setCurrentTime(0);
    }
  }, [timelineClips, selectedClip, setSelectedClip, setCurrentTime]);

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

  // Calculate absolute time position in the timeline
  const getAbsoluteTimePosition = useCallback(() => {
    if (!selectedClip || timelineClips.length === 0) return 0;

    const currentClipIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    if (currentClipIndex === -1) return 0;

    // Calculate total duration of clips before current clip
    let totalDurationBefore = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timelineClips[i];
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      totalDurationBefore += clipDuration;
    }

    return totalDurationBefore + currentTime;
  }, [selectedClip, timelineClips, currentTime]);

  const seekToAbsoluteTime = useCallback((absoluteTime: number) => {
    if (timelineClips.length === 0) return;

    console.log("Seeking to absolute time:", absoluteTime);

    // Find which clip this absolute time falls into
    let accumulatedTime = 0;
    for (const clip of timelineClips) {
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      
      if (absoluteTime <= accumulatedTime + clipDuration) {
        // This is the target clip
        const timeInClip = absoluteTime - accumulatedTime;
        console.log("Switching to clip:", clip.id, "time in clip:", timeInClip);
        
        setSelectedClip(clip);
        
        if (videoRef.current) {
          const clipStartTime = clip.startTime ?? 0;
          const videoAbsoluteTime = clipStartTime + timeInClip;
          videoRef.current.currentTime = videoAbsoluteTime;
          setCurrentTime(timeInClip);
          
          if (audioRef.current) {
            audioRef.current.currentTime = videoAbsoluteTime;
          }
        }
        break;
      }
      
      accumulatedTime += clipDuration;
    }
  }, [timelineClips, setSelectedClip, setCurrentTime]);

  // Sync audio with video when playing
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    
    if (video && audio && isPlaying) {
      const syncInterval = setInterval(() => {
        if (Math.abs(video.currentTime - audio.currentTime) > 0.2) {
          audio.currentTime = video.currentTime;
        }
      }, 100);
      
      return () => clearInterval(syncInterval);
    }
  }, [isPlaying]);

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

      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(e => console.error("Video play error:", e));
      }
      
      if (audio) {
        audio.play().catch(e => console.error("Audio play error:", e));
      }
    } else {
      video.pause();
      audio?.pause();
    }
  }, [selectedClip, setSelectedClip]);

  const jumpToStart = useCallback(() => {
    if (timelineClips.length === 0) return;
    
    console.log("Jumping to start of timeline");
    const firstClip = timelineClips[0];
    setSelectedClip(firstClip);
    
    if (videoRef.current) {
      const clipStartTime = firstClip.startTime ?? 0;
      videoRef.current.currentTime = clipStartTime;
      setCurrentTime(0);
      
      if (audioRef.current) {
        audioRef.current.currentTime = clipStartTime;
      }
    }
  }, [timelineClips, setSelectedClip, setCurrentTime]);

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

  const seekToTime = useCallback((time: number) => {
    if (!videoRef.current || !selectedClip) return;
    
    const video = videoRef.current;
    const clipStartTime = selectedClip.startTime ?? 0;
    const absoluteTime = clipStartTime + time;
    
    video.currentTime = absoluteTime;
    setCurrentTime(time);
    
    if (audioRef.current) {
      audioRef.current.currentTime = absoluteTime;
    }
  }, [selectedClip, setCurrentTime]);

  const handleClipEnded = useCallback(() => {
    if (!selectedClip || timelineClips.length === 0) return;

    console.log("Clip ended, transitioning to next clip");
    const currentIndex = timelineClips.findIndex(c => c.id === selectedClip.id);

    if (currentIndex >= 0 && currentIndex < timelineClips.length - 1) {
      const nextClip = timelineClips[currentIndex + 1];
      console.log("Moving to next clip:", nextClip.id);
      
      setWasPlaying(isPlaying);
      setSelectedClip(nextClip);
      
      // Ensure smooth transition to next clip
      setTimeout(() => {
        if (videoRef.current) {
          const nextClipStartTime = nextClip.startTime ?? 0;
          videoRef.current.currentTime = nextClipStartTime;
          setCurrentTime(0);
          
          if (audioRef.current) {
            audioRef.current.currentTime = nextClipStartTime;
          }
          
          // Continue playing if we were playing
          if (isPlaying) {
            videoRef.current.play().catch(e => console.error("Auto-play next clip failed:", e));
            audioRef.current?.play().catch(e => console.error("Auto-play next audio failed:", e));
          }
        }
      }, 100);
    } else {
      // End of timeline
      console.log("Reached end of timeline");
      const video = videoRef.current;
      const audio = audioRef.current;
      if (video) video.pause();
      if (audio) audio.pause();
      setIsPlaying(false);
    }
  }, [selectedClip, timelineClips, isPlaying, setWasPlaying, setSelectedClip, setIsPlaying, setCurrentTime]);

  const value = {
    togglePlay,
    jumpToStart,
    jumpToEnd,
    handleClipEnded,
    seekToTime,
    seekToAbsoluteTime,
    videoRef,
    audioRef,
    getAbsoluteTimePosition,
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
