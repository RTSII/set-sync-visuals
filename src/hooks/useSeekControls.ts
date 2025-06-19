
import { useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useSeekControls = (
  videoRef: React.RefObject<HTMLVideoElement>,
  audioRef: React.RefObject<HTMLAudioElement>
) => {
  const {
    timelineClips,
    selectedClip,
    setSelectedClip,
    setCurrentTime,
    absoluteTimelinePosition,
    setAbsoluteTimelinePosition
  } = useEditorStore();

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

  return {
    getAbsoluteTimePosition,
    seekToAbsoluteTime,
    seekToTime
  };
};
