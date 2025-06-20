
import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useVideoTimeSync = (
  videoRef: React.RefObject<HTMLVideoElement>
) => {
  const {
    selectedClip,
    timelineClips,
    setCurrentTime,
    setAbsoluteTimelinePosition,
    isAudioMaster
  } = useEditorStore();

  // Handle video-only timeline position tracking (NOT transitions)
  const syncVideoTime = useCallback(() => {
    // CRITICAL FIX: Only run in video-only mode and ensure we have necessary elements
    if (isAudioMaster || !videoRef.current || !selectedClip) {
      return;
    }

    const video = videoRef.current;
    const videoCurrentTime = video.currentTime;
    const clipStartTime = selectedClip.startTime ?? 0;

    // Skip if video is not ready
    if (video.readyState < 2) {
      console.log("🎬 VIDEO-SYNC: Video not ready, skipping sync");
      return;
    }

    console.log("🎬 VIDEO-SYNC: Updating position - video time:", videoCurrentTime, "clip start:", clipStartTime);

    // Update relative time within the clip
    const relativeTime = Math.max(0, videoCurrentTime - clipStartTime);
    setCurrentTime(relativeTime);

    // Calculate absolute position in timeline
    const currentClipIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    if (currentClipIndex >= 0) {
      let accumulatedTime = 0;
      for (let i = 0; i < currentClipIndex; i++) {
        const clip = timelineClips[i];
        const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
        accumulatedTime += clipDuration;
      }
      const absoluteTime = accumulatedTime + relativeTime;
      setAbsoluteTimelinePosition(absoluteTime);
    }
  }, [selectedClip, timelineClips, setCurrentTime, setAbsoluteTimelinePosition, isAudioMaster]);

  // Listen to video timeupdate events (only in video-only mode)
  useEffect(() => {
    // CRITICAL FIX: Early return if in audio master mode
    if (isAudioMaster) {
      console.log("🎬 VIDEO-SYNC: Skipping video sync setup - audio master mode active");
      return;
    }
    
    const video = videoRef.current;
    if (!video) {
      console.log("🎬 VIDEO-SYNC: No video element available");
      return;
    }

    console.log("🎬 VIDEO-SYNC: Setting up timeupdate listener for video-only mode");

    const handleVideoTimeUpdate = () => {
      syncVideoTime();
    };

    // CRITICAL FIX: Add listener with proper cleanup
    video.addEventListener('timeupdate', handleVideoTimeUpdate);
    
    return () => {
      console.log("🎬 VIDEO-SYNC: Cleaning up timeupdate listener");
      video.removeEventListener('timeupdate', handleVideoTimeUpdate);
    };
  }, [syncVideoTime, isAudioMaster, selectedClip?.id]); // Added selectedClip dependency for proper reinitialization

  return {
    syncVideoTime
  };
};
