
import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useAudioTimeSync = (
  videoRef: React.RefObject<HTMLVideoElement>,
  audioRef: React.RefObject<HTMLAudioElement>
) => {
  const {
    timelineClips,
    selectedClip,
    setSelectedClip,
    setCurrentTime,
    setAbsoluteTimelinePosition
  } = useEditorStore();

  // Sync video clips to audio timeline position
  const syncToAudioTime = useCallback(() => {
    if (!audioRef.current || timelineClips.length === 0) return;

    const audioCurrentTime = audioRef.current.currentTime;
    
    // Find which clip should be active based on audio time
    let accumulatedTime = 0;
    let targetClip = null;
    let timeInClip = 0;

    for (const clip of timelineClips) {
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      
      if (audioCurrentTime <= accumulatedTime + clipDuration) {
        targetClip = clip;
        timeInClip = audioCurrentTime - accumulatedTime;
        break;
      }
      
      accumulatedTime += clipDuration;
    }

    if (targetClip && targetClip.id !== selectedClip?.id) {
      console.log("🎵 AUDIO-SYNC: Auto-selecting clip based on audio time:", targetClip.id);
      setSelectedClip(targetClip);
      
      // Sync video to correct position
      if (videoRef.current) {
        const clipStartTime = targetClip.startTime ?? 0;
        const videoTime = clipStartTime + timeInClip;
        videoRef.current.currentTime = videoTime;
      }
    }

    // Update current time and absolute position
    if (targetClip) {
      setCurrentTime(timeInClip);
      setAbsoluteTimelinePosition(audioCurrentTime);
    }
  }, [timelineClips, selectedClip, setSelectedClip, setCurrentTime, setAbsoluteTimelinePosition]);

  // Listen to audio timeupdate events to drive the timeline
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioTimeUpdate = () => {
      syncToAudioTime();
    };

    audio.addEventListener('timeupdate', handleAudioTimeUpdate);
    
    return () => {
      audio.removeEventListener('timeupdate', handleAudioTimeUpdate);
    };
  }, [syncToAudioTime]);

  return {
    syncToAudioTime
  };
};
