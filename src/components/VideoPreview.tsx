import { Button } from "@/components/ui/button";
import { Pause, Play, Rewind, FastForward, Expand } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import { useEditorStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import React from 'react';
import { toast } from "sonner";

const VideoPreview = () => {
  const {
    videoRef,
    togglePlay,
    jumpToStart,
    jumpToEnd,
    handleClipEnded,
    seekToTime,
  } = useEditor();

  const {
    selectedClip,
    isPlaying,
    currentTime,
    setCurrentTime,
    updateClip,
    timelineClips,
    absoluteTimelinePosition,
    setAbsoluteTimelinePosition
  } = useEditorStore();

  const [clipDisplayDuration, setClipDisplayDuration] = React.useState(0);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  const isTransitioning = React.useRef(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedClip && !isTransitioning.current) {
      const videoCurrentTime = videoRef.current.currentTime;
      const clipStartTime = selectedClip.startTime ?? 0;
      const clipEndTime = selectedClip.endTime ?? videoRef.current.duration;

      // Check if we've reached the end of the current clip
      if (clipEndTime && videoCurrentTime >= clipEndTime - 0.05) {
        console.log("🎬 TIME-UPDATE: Clip reached end, triggering transition");
        isTransitioning.current = true;
        handleClipEnded();
        // Reset transition flag after a short delay
        setTimeout(() => {
          isTransitioning.current = false;
        }, 100);
      } else {
        // Update relative time within the clip
        const relativeTime = Math.max(0, videoCurrentTime - clipStartTime);
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
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && selectedClip) {
      const videoDuration = videoRef.current.duration || 0;
      console.log("🎬 METADATA: Video loaded for clip:", selectedClip.id, "duration:", videoDuration);

      // Update clip metadata if needed
      if (!selectedClip.originalDuration || selectedClip.originalDuration === 0) {
        console.log("🎬 METADATA: Updating clip with video duration");
        updateClip(selectedClip.id, {
          startTime: 0,
          endTime: videoDuration,
          originalDuration: videoDuration,
        });
        setClipDisplayDuration(videoDuration);
      } else {
        const clipStartTime = selectedClip.startTime ?? 0;
        const clipEndTime = selectedClip.endTime ?? videoDuration;
        const clipDuration = clipEndTime - clipStartTime;

        // Set video to clip start time
        videoRef.current.currentTime = clipStartTime;
        setClipDisplayDuration(clipDuration || videoDuration);
        setCurrentTime(0);
      }
    }
  };

  const handleVideoEnded = () => {
    console.log("🎬 VIDEO-END: Video element ended event");
    if (!isTransitioning.current) {
      handleClipEnded();
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedClip || clipDisplayDuration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * clipDisplayDuration;
    
    console.log("🎬 PROGRESS-CLICK: Seeking to time:", newTime);
    seekToTime(newTime);
  };

  // Reset video when selectedClip changes
  React.useEffect(() => {
    if (videoRef.current && selectedClip) {
      const clipStartTime = selectedClip.startTime ?? 0;
      const clipEndTime = selectedClip.endTime ?? selectedClip.originalDuration;
      const clipDuration = (clipEndTime || 0) - clipStartTime;

      console.log("🎬 CLIP-CHANGE: Selected clip changed to:", selectedClip.id);
      console.log("🎬 CLIP-CHANGE: Setting video time to:", clipStartTime);
      
      // Set video to clip start time
      videoRef.current.currentTime = clipStartTime;
      setClipDisplayDuration(clipDuration > 0 ? clipDuration : (videoRef.current.duration || 8));
      setCurrentTime(0);
    }
  }, [selectedClip?.id, selectedClip?.startTime, selectedClip?.endTime, setCurrentTime]);

  const toggleFullScreen = () => {
    const elem = previewContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        toast.error("Could not enter full screen mode.", { description: err.message });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const progressPercentage = clipDisplayDuration > 0 ? Math.min(100, (currentTime / clipDisplayDuration) * 100) : 0;

  const currentClipIndex = selectedClip ? timelineClips.findIndex(c => c.id === selectedClip.id) + 1 : 0;
  const totalClips = timelineClips.length;

  return (
    <div ref={previewContainerRef} className="bg-card border border-border rounded-lg overflow-hidden grid grid-rows-[1fr_auto] h-full">
      <div className="bg-black flex items-center justify-center relative group overflow-hidden">
        {selectedClip ? (
          <video
            ref={videoRef}
            src={selectedClip.src}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            onClick={togglePlay}
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-4">
            <img
              src="/lovable-uploads/68782036-637d-4eae-9d56-aeb41156f0bd.png"
              alt="RVJ Logo"
              className="w-1/3 h-1/3 object-contain opacity-50"
            />
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Select a clip to preview</p>
              <p className="text-sm">Use Space to play/pause, J/L for -10s/+10s, ←/→ for -5s/+5s</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-2 bg-secondary/20 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={jumpToStart} title="Jump to project start">
            <Rewind className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={togglePlay} title="Play/Pause (Space)">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={jumpToEnd} title="Jump to clip end">
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 mx-4">
          <div 
            className="w-full bg-muted h-1.5 rounded-full overflow-hidden cursor-pointer"
            onClick={handleProgressBarClick}
          >
            <div className="bg-primary h-full transition-all duration-100" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{formatTime(currentTime)} / {formatTime(clipDisplayDuration)}</span>
          {totalClips > 0 && (
            <span className="text-xs text-muted-foreground">({currentClipIndex}/{totalClips})</span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleFullScreen} title="Fullscreen">
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
