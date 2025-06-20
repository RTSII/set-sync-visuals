
import { useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const useClipTransition = (
  videoRef: React.RefObject<HTMLVideoElement>,
  audioRef: React.RefObject<HTMLAudioElement>
) => {
  const {
    selectedClip,
    timelineClips,
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
      
      // Calculate new absolute position
      let newAbsolutePosition = 0;
      for (let i = 0; i <= currentIndex; i++) {
        const clip = timelineClips[i];
        const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
        newAbsolutePosition += clipDuration;
      }
      
      // Update state immediately
      setAbsoluteTimelinePosition(newAbsolutePosition);
      setSelectedClip(nextClip);
      setCurrentTime(0);
      
      // Handle video transition
      if (videoRef.current) {
        const video = videoRef.current;
        const nextClipStartTime = nextClip.startTime ?? 0;
        const wasPlaying = !video.paused;
        
        console.log("🔄 CLIP-END: Video was playing:", wasPlaying);
        
        if (video.src !== nextClip.src) {
          // Different video source - preload and transition
          console.log("🔄 CLIP-END: Changing video source");
          
          const handleLoadedData = () => {
            console.log("🔄 CLIP-END: New video loaded, setting time");
            video.currentTime = nextClipStartTime;
            
            if (wasPlaying) {
              video.play().then(() => {
                console.log("🔄 CLIP-END: ✅ Video playback resumed");
              }).catch(e => {
                console.error("🔄 CLIP-END: ❌ Video play failed:", e);
              });
            }
            
            video.removeEventListener('loadeddata', handleLoadedData);
          };
          
          video.addEventListener('loadeddata', handleLoadedData);
          video.src = nextClip.src;
          video.load();
        } else {
          // Same video source - just update time
          console.log("🔄 CLIP-END: Same video source, updating time");
          video.currentTime = nextClipStartTime;
          
          if (wasPlaying && video.paused) {
            video.play().catch(e => 
              console.error("🔄 CLIP-END: Video play failed:", e)
            );
          }
        }
      }
      
      // Handle audio in audio-master mode
      if (isAudioMaster && audioRef.current) {
        const audio = audioRef.current;
        const wasAudioPlaying = !audio.paused;
        
        // Audio continues uninterrupted in audio-master mode
        if (wasAudioPlaying) {
          console.log("🔄 CLIP-END: Audio continues playing (master mode)");
        }
      }
    } else {
      // End of timeline - stop playback
      console.log("🔄 CLIP-END: Reached end of timeline");
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [selectedClip, timelineClips, setSelectedClip, setCurrentTime, setAbsoluteTimelinePosition, setIsPlaying, isAudioMaster]);

  return {
    handleClipEnded
  };
};
