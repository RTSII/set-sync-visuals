
import { useEffect, useCallback, useRef } from 'react';
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
    setAbsoluteTimelinePosition,
    isAudioMaster
  } = useEditorStore();

  const isTransitioning = useRef(false);
  const lastSyncTime = useRef(0);

  // Sync video clips to audio timeline position
  const syncToAudioTime = useCallback(() => {
    // Only run in audio master mode
    if (!isAudioMaster || !audioRef.current || timelineClips.length === 0) return;

    const audioCurrentTime = audioRef.current.currentTime;
    
    // Prevent excessive syncing during rapid changes or transitions
    if (Math.abs(audioCurrentTime - lastSyncTime.current) < 0.1 && !isTransitioning.current) {
      return;
    }
    lastSyncTime.current = audioCurrentTime;
    
    // Skip sync during clip transitions to prevent conflicts
    if (isTransitioning.current) {
      console.log("🎵 AUDIO-SYNC: Skipping sync during transition");
      return;
    }
    
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

    // Only change clips if we've moved to a significantly different position
    // and it's not due to natural playback progression
    if (targetClip && targetClip.id !== selectedClip?.id) {
      const timeDifference = Math.abs(audioCurrentTime - (selectedClip ? accumulatedTime : 0));
      
      // Only auto-select if there's a significant time jump (user seeking)
      if (timeDifference > 1) {
        console.log("🎵 AUDIO-SYNC: Large time jump detected, auto-selecting clip:", targetClip.id);
        
        // Store current audio playing state
        const wasAudioPlaying = !audioRef.current.paused;
        
        // Prevent transition conflicts
        isTransitioning.current = true;
        
        setSelectedClip(targetClip);
        
        // Sync video to correct position
        if (videoRef.current) {
          const clipStartTime = targetClip.startTime ?? 0;
          const videoTime = clipStartTime + timeInClip;
          
          console.log("🎵 AUDIO-SYNC: Setting video time to:", videoTime);
          
          if (videoRef.current.src !== targetClip.src) {
            // Different video source
            const handleCanPlay = () => {
              videoRef.current!.currentTime = videoTime;
              
              if (wasAudioPlaying) {
                videoRef.current!.play().catch(e => 
                  console.error("🎵 AUDIO-SYNC: Video play failed:", e)
                );
              }
              
              videoRef.current!.removeEventListener('canplay', handleCanPlay);
              
              // Clear transition flag after video is ready
              setTimeout(() => {
                isTransitioning.current = false;
              }, 100);
            };
            
            videoRef.current.addEventListener('canplay', handleCanPlay);
            videoRef.current.src = targetClip.src;
            videoRef.current.load();
          } else {
            // Same video source
            videoRef.current.currentTime = videoTime;
            
            if (wasAudioPlaying && videoRef.current.paused) {
              videoRef.current.play().catch(e => 
                console.error("🎵 AUDIO-SYNC: Video play failed:", e)
              );
            }
            
            // Clear transition flag
            setTimeout(() => {
              isTransitioning.current = false;
            }, 100);
          }
        }
      }
    }

    // Update current time and absolute position
    if (targetClip) {
      setCurrentTime(timeInClip);
      setAbsoluteTimelinePosition(audioCurrentTime);
    }
  }, [timelineClips, selectedClip, setSelectedClip, setCurrentTime, setAbsoluteTimelinePosition, isAudioMaster]);

  // Listen to audio timeupdate events (only in audio master mode)
  useEffect(() => {
    if (!isAudioMaster) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    const handleAudioTimeUpdate = () => {
      syncToAudioTime();
    };

    // Set transition flag when audio starts playing
    const handleAudioPlay = () => {
      isTransitioning.current = true;
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    };

    // Handle natural clip transitions during audio playback
    const handleAudioSeek = () => {
      isTransitioning.current = false; // Allow immediate sync on user seeking
    };

    audio.addEventListener('timeupdate', handleAudioTimeUpdate);
    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('seeked', handleAudioSeek);
    
    return () => {
      audio.removeEventListener('timeupdate', handleAudioTimeUpdate);
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('seeked', handleAudioSeek);
    };
  }, [syncToAudioTime, isAudioMaster]);

  return {
    syncToAudioTime
  };
};
