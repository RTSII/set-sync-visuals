
import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useVideoTimeSync = (
  videoRef: React.RefObject<HTMLVideoElement>
) => {
  const {
    selectedClip,
    setCurrentTime,
    isAudioMaster
  } = useEditorStore();

  // Only sync video time in video-only mode
  const syncVideoTime = useCallback(() => {
    if (isAudioMaster || !videoRef.current || !selectedClip) {
      return;
    }

    const video = videoRef.current;
    const videoCurrentTime = video.currentTime;
    const clipStartTime = selectedClip.startTime ?? 0;
    const relativeTime = Math.max(0, videoCurrentTime - clipStartTime);
    
    setCurrentTime(relativeTime);
  }, [selectedClip, setCurrentTime, isAudioMaster]);

  // Simple timeupdate listener - only in video-only mode
  useEffect(() => {
    if (isAudioMaster || !videoRef.current) {
      return;
    }
    
    const video = videoRef.current;
    video.addEventListener('timeupdate', syncVideoTime);
    
    return () => {
      video.removeEventListener('timeupdate', syncVideoTime);
    };
  }, [syncVideoTime, isAudioMaster]);

  return {
    syncVideoTime
  };
};
