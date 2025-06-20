
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
    setIsPlaying,
    isAudioMaster
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
      
      // Update state immediately for UI consistency
      setAbsoluteTimelinePosition(newAbsolutePosition);
      setSelectedClip(nextClip);
      setCurrentTime(0);
      
      // Handle video transition - different logic for each mode
      if (videoRef.current) {
        const video = videoRef.current;
        const nextClipStartTime = nextClip.startTime ?? 0;
        const wasPlaying = !video.paused;
        
        console.log("🔄 CLIP-END: Video was playing:", wasPlaying, "Mode:", isAudioMaster ? "audio-master" : "video-only");
        
        if (video.src !== nextClip.src) {
          // Different video source - need to change src
          console.log("🔄 CLIP-END: Changing video source");
          
          const handleCanPlay = () => {
            console.log("🔄 CLIP-END: New video ready");
            
            if (isAudioMaster && audioRef.current) {
              // In audio master mode, sync video to current audio time
              const audioCurrentTime = audioRef.current.currentTime;
              const relativeVideoTime = audioCurrentTime - newAbsolutePosition + nextClipStartTime;
              const targetTime = Math.max(nextClipStartTime, relativeVideoTime);
              console.log("🔄 CLIP-END: Audio-master mode - syncing video to:", targetTime);
              video.currentTime = targetTime;
            } else {
              // In video-only mode, start from clip beginning
              console.log("🔄 CLIP-END: Video-only mode - starting from:", nextClipStartTime);
              video.currentTime = nextClipStartTime;
            }
            
            // Continue playing if it was playing before
            if (wasPlaying) {
              console.log("🔄 CLIP-END: Resuming playback");
              video.play().catch(e => console.error("🔄 CLIP-END: Video play failed:", e));
            }
            
            video.removeEventListener('canplay', handleCanPlay);
          };
          
          video.addEventListener('canplay', handleCanPlay);
          video.src = nextClip.src;
          video.load();
        } else {
          // Same video source - just update time
          console.log("🔄 CLIP-END: Same video source, updating position");
          
          if (isAudioMaster && audioRef.current) {
            const audioCurrentTime = audioRef.current.currentTime;
            const relativeVideoTime = audioCurrentTime - newAbsolutePosition + nextClipStartTime;
            video.currentTime = Math.max(nextClipStartTime, relativeVideoTime);
          } else {
            video.currentTime = nextClipStartTime;
          }
          
          if (wasPlaying && video.paused) {
            video.play().catch(e => console.error("🔄 CLIP-END: Video play failed:", e));
          }
        }
      }
    } else {
      // End of timeline - stop playback
      console.log("🔄 CLIP-END: Reached end of timeline, stopping playback");
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [selectedClip, timelineClips, setSelectedClip, setCurrentTime, setAbsoluteTimelinePosition, setIsPlaying, isAudioMaster]);

  return {
    handleClipEnded
  };
};
