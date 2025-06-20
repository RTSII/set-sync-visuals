
import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useVideoTimeSync = (
  videoRef: React.RefObject<HTMLVideoElement>
) => {
  const {
    timelineClips,
    selectedClip,
    setSelectedClip,
    setCurrentTime,
    setAbsoluteTimelinePosition,
    isAudioMaster
  } = useEditorStore();

  // Handle video-only timeline progression
  const syncVideoTime = useCallback(() => {
    // Only run in video-only mode
    if (isAudioMaster || !videoRef.current || !selectedClip) return;

    const video = videoRef.current;
    const videoCurrentTime = video.currentTime;
    const clipStartTime = selectedClip.startTime ?? 0;
    const clipEndTime = selectedClip.endTime ?? selectedClip.originalDuration ?? 0;

    // Update relative time within the clip
    const relativeTime = Math.max(0, videoCurrentTime - clipStartTime);
    setCurrentTime(relativeTime);

    // Calculate absolute position
    const currentClipIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    let accumulatedTime = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timelineClips[i];
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      accumulatedTime += clipDuration;
    }
    const absoluteTime = accumulatedTime + relativeTime;
    setAbsoluteTimelinePosition(absoluteTime);

  }, [selectedClip, timelineClips, setCurrentTime, setAbsoluteTimelinePosition, isAudioMaster]);

  // Listen to video timeupdate events (only in video-only mode)
  useEffect(() => {
    if (isAudioMaster) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleVideoTimeUpdate = () => {
      syncVideoTime();
    };

    video.addEventListener('timeupdate', handleVideoTimeUpdate);
    
    return () => {
      video.removeEventListener('timeupdate', handleVideoTimeUpdate);
    };
  }, [syncVideoTime, isAudioMaster]);

  return {
    syncVideoTime
  };
};
