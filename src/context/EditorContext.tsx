
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
    currentTime,
    absoluteTimelinePosition,
    setAbsoluteTimelinePosition,
    resetToTimelineStart
  } = useEditorStore();

  // Auto-select first clip when clips are added
  useEffect(() => {
    if (timelineClips.length > 0 && !selectedClip) {
      console.log("🎯 AUTO-SELECT: Timeline has clips but no selection, triggering reset");
      resetToTimelineStart();
    }
  }, [timelineClips.length, selectedClip, resetToTimelineStart]);

  // Sync video/audio play/pause state
  useEffect(() => {
    const video = videoRef.current;
    const handlePlay = () => {
      console.log("🎮 VIDEO: Play event triggered");
      setIsPlaying(true);
    };
    const handlePause = () => {
      console.log("🎮 VIDEO: Pause event triggered");
      setIsPlaying(false);
    };

    const removePlayListener = safeAddEventListener(video, 'play', handlePlay);
    const removePauseListener = safeAddEventListener(video, 'pause', handlePause);

    return () => {
      removePlayListener();
      removePauseListener();
    };
  }, [setIsPlaying]);

  const getAbsoluteTimePosition = useCallback(() => {
    return absoluteTimelinePosition;
  }, [absoluteTimelinePosition]);

  const seekToAbsoluteTime = useCallback((absoluteTime: number) => {
    if (timelineClips.length === 0) return;

    console.log("🎯 SEEK: Seeking to absolute time:", absoluteTime);
    
    // Find which clip this absolute time falls into
    let accumulatedTime = 0;
    let targetClip = null;
    let timeInClip = 0;

    for (const clip of timelineClips) {
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      
      if (absoluteTime <= accumulatedTime + clipDuration) {
        targetClip = clip;
        timeInClip = absoluteTime - accumulatedTime;
        break;
      }
      
      accumulatedTime += clipDuration;
    }

    if (targetClip) {
      console.log("🎯 SEEK: Found target clip:", targetClip.id, "time in clip:", timeInClip);
      
      // Update store state first
      setAbsoluteTimelinePosition(absoluteTime);
      setCurrentTime(timeInClip);
      setSelectedClip(targetClip);
      
      // Then update video/audio elements
      if (videoRef.current) {
        const clipStartTime = targetClip.startTime ?? 0;
        const videoAbsoluteTime = clipStartTime + timeInClip;
        videoRef.current.currentTime = videoAbsoluteTime;
        
        if (audioRef.current) {
          audioRef.current.currentTime = videoAbsoluteTime;
        }
      }
    }
  }, [timelineClips, setSelectedClip, setCurrentTime, setAbsoluteTimelinePosition]);

  const togglePlay = useCallback(() => {
    if (!selectedClip || !videoRef.current) {
      console.log("🎮 PLAY: No clip selected or video ref not available");
      return;
    }
    
    const video = videoRef.current;
    const audio = audioRef.current;

    console.log("🎮 PLAY: Toggle play called, current paused:", video.paused);

    if (video.paused) {
      // Update clip metadata if needed
      if (selectedClip.originalDuration === 0 && video.duration > 0) {
        console.log("🎮 PLAY: Updating clip metadata with video duration:", video.duration);
        const updatedClip = {
          ...selectedClip,
          originalDuration: video.duration,
          endTime: video.duration
        };
        setSelectedClip(updatedClip);
      }

      // Start playback
      video.play().catch(e => console.error("🎮 PLAY: Video play error:", e));
      audio?.play().catch(e => console.error("🎮 PLAY: Audio play error:", e));
    } else {
      // Pause playback
      video.pause();
      audio?.pause();
    }
  }, [selectedClip, setSelectedClip]);

  const jumpToStart = useCallback(() => {
    console.log("🎯 JUMP: Jumping to timeline start");
    resetToTimelineStart();
    
    // Reset video/audio elements to first clip start
    if (videoRef.current && timelineClips.length > 0) {
      const firstClip = timelineClips[0];
      const clipStartTime = firstClip.startTime ?? 0;
      
      videoRef.current.currentTime = clipStartTime;
      if (audioRef.current) {
        audioRef.current.currentTime = clipStartTime;
      }
    }
  }, [timelineClips, resetToTimelineStart]);

  const jumpToEnd = useCallback(() => {
    if (!selectedClip || !videoRef.current) return;
    
    const video = videoRef.current;
    const clipEndTime = selectedClip.endTime ?? video.duration;
    const clipStartTime = selectedClip.startTime ?? 0;
    const relativeTime = clipEndTime - clipStartTime;

    console.log("🎯 JUMP: Jumping to clip end, relative time:", relativeTime);

    video.currentTime = clipEndTime;
    setCurrentTime(relativeTime);
    
    // Update absolute timeline position
    const currentClipIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    let accumulatedTime = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timelineClips[i];
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      accumulatedTime += clipDuration;
    }
    accumulatedTime += relativeTime;
    setAbsoluteTimelinePosition(accumulatedTime);

    if (audioRef.current) {
      audioRef.current.currentTime = clipEndTime;
    }
  }, [selectedClip, setCurrentTime, timelineClips, setAbsoluteTimelinePosition]);

  const seekToTime = useCallback((time: number) => {
    if (!videoRef.current || !selectedClip) return;
    
    const video = videoRef.current;
    const clipStartTime = selectedClip.startTime ?? 0;
    const absoluteTime = clipStartTime + time;
    
    console.log("🎯 SEEK: Seeking to relative time:", time, "absolute time:", absoluteTime);
    
    video.currentTime = absoluteTime;
    setCurrentTime(time);
    
    // Update absolute timeline position
    const currentClipIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    let accumulatedTime = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timelineClips[i];
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      accumulatedTime += clipDuration;
    }
    accumulatedTime += time;
    setAbsoluteTimelinePosition(accumulatedTime);
    
    if (audioRef.current) {
      audioRef.current.currentTime = absoluteTime;
    }
  }, [selectedClip, setCurrentTime, timelineClips, setAbsoluteTimelinePosition]);

  const handleClipEnded = useCallback(() => {
    if (!selectedClip || timelineClips.length === 0) {
      console.log("🔄 CLIP-END: No clip selected or no clips in timeline");
      return;
    }

    console.log("🔄 CLIP-END: Current clip ended:", selectedClip.id);
    const currentIndex = timelineClips.findIndex(c => c.id === selectedClip.id);

    if (currentIndex >= 0 && currentIndex < timelineClips.length - 1) {
      const nextClip = timelineClips[currentIndex + 1];
      console.log("🔄 CLIP-END: Moving to next clip:", nextClip.id);
      
      // Calculate new absolute position (end of current clip)
      let newAbsolutePosition = 0;
      for (let i = 0; i <= currentIndex; i++) {
        const clip = timelineClips[i];
        const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
        newAbsolutePosition += clipDuration;
      }
      
      // Store if we were playing
      const wasPlayingBefore = isPlaying;
      
      // Update state immediately
      setAbsoluteTimelinePosition(newAbsolutePosition);
      setSelectedClip(nextClip);
      setCurrentTime(0);
      
      // Update video element and handle playback continuation
      if (videoRef.current) {
        const nextClipStartTime = nextClip.startTime ?? 0;
        console.log("🔄 CLIP-END: Setting video time to:", nextClipStartTime);
        
        // Set video source and time
        videoRef.current.currentTime = nextClipStartTime;
        
        if (audioRef.current) {
          audioRef.current.currentTime = nextClipStartTime;
        }
        
        // Continue playing if we were playing before
        if (wasPlayingBefore) {
          console.log("🔄 CLIP-END: Continuing playback on next clip");
          
          // Wait for the video to be ready before playing
          const continuePlayback = () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              console.log("🔄 CLIP-END: Video ready, starting playback");
              videoRef.current.play().then(() => {
                console.log("🔄 CLIP-END: Video playback started successfully");
              }).catch(e => {
                console.error("🔄 CLIP-END: Video play failed:", e);
                // Try again after a short delay
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(err => 
                      console.error("🔄 CLIP-END: Second video play attempt failed:", err)
                    );
                  }
                }, 100);
              });
              
              if (audioRef.current) {
                audioRef.current.play().catch(e => 
                  console.error("🔄 CLIP-END: Audio play failed:", e)
                );
              }
            } else {
              console.log("🔄 CLIP-END: Video not ready, waiting...");
              // If video isn't ready, wait a bit longer
              setTimeout(continuePlayback, 150);
            }
          };
          
          // Start the playback continuation process
          setTimeout(continuePlayback, 50);
        }
      }
    } else {
      // End of timeline
      console.log("🔄 CLIP-END: Reached end of timeline, stopping playback");
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [selectedClip, timelineClips, isPlaying, setSelectedClip, setCurrentTime, setAbsoluteTimelinePosition, setIsPlaying]);

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
