
import { useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useClipTransition = (
  videoRef: React.RefObject<HTMLVideoElement>,
  audioRef: React.RefObject<HTMLAudioElement>
) => {
  const {
    selectedClip,
    timelineClips,
    isPlaying,
    setSelectedClip,
    setCurrentTime,
    setAbsoluteTimelinePosition,
    setIsPlaying
  } = useEditorStore();

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
      
      // Store if we were playing before transition
      const wasPlayingBefore = isPlaying;
      
      // Update state immediately
      setAbsoluteTimelinePosition(newAbsolutePosition);
      setSelectedClip(nextClip);
      setCurrentTime(0);
      
      // Update video element and continue playback seamlessly
      if (videoRef.current) {
        const nextClipStartTime = nextClip.startTime ?? 0;
        console.log("🔄 CLIP-END: Setting video time to:", nextClipStartTime);
        
        // Set video source and time
        videoRef.current.currentTime = nextClipStartTime;
        
        if (audioRef.current) {
          audioRef.current.currentTime = nextClipStartTime;
        }
        
        // Continue playing immediately if we were playing before
        if (wasPlayingBefore) {
          console.log("🔄 CLIP-END: Continuing seamless playback on next clip");
          
          // Use requestAnimationFrame for smoother transition
          requestAnimationFrame(() => {
            if (videoRef.current && wasPlayingBefore) {
              videoRef.current.play().then(() => {
                console.log("🔄 CLIP-END: Video playback continued successfully");
              }).catch(e => {
                console.error("🔄 CLIP-END: Video play failed:", e);
                // Don't set isPlaying to false here - let the video sync handle it
              });
              
              if (audioRef.current) {
                audioRef.current.play().catch(e => 
                  console.error("🔄 CLIP-END: Audio play failed:", e)
                );
              }
            }
          });
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

  return {
    handleClipEnded
  };
};
