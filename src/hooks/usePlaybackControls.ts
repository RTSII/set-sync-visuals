
import { useCallback } from 'react';
import { useEditorStore } from '@/lib/store';

export const usePlaybackControls = (
  videoRef: React.RefObject<HTMLVideoElement>,
  audioRef: React.RefObject<HTMLAudioElement>
) => {
  const {
    timelineClips,
    selectedClip,
    setSelectedClip,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    absoluteTimelinePosition,
    setAbsoluteTimelinePosition,
    resetToTimelineStart
  } = useEditorStore();

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

  return {
    togglePlay,
    jumpToStart,
    jumpToEnd
  };
};
