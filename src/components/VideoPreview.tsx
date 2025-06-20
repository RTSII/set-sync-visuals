
import { Button } from "@/components/ui/button";
import { Pause, Play, Rewind, FastForward, Expand } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import { useEditorStore } from "@/lib/store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import React from 'react';
import { toast } from "sonner";

const VideoPreview = () => {
  console.log("🎬 VideoPreview: Component rendering");
  
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
    isAudioMaster
  } = useEditorStore();

  console.log("🎬 VideoPreview: selectedClip:", selectedClip?.id, "isPlaying:", isPlaying, "currentTime:", currentTime);

  const [clipDisplayDuration, setClipDisplayDuration] = React.useState(0);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Simplified time update handler
  const handleTimeUpdate = React.useCallback(() => {
    console.log("🎬 VideoPreview: handleTimeUpdate called, isAudioMaster:", isAudioMaster);
    
    if (isAudioMaster || !videoRef.current || !selectedClip) {
      console.log("🎬 VideoPreview: Skipping time update - audio master mode or no video/clip");
      return;
    }

    const videoCurrentTime = videoRef.current.currentTime;
    const clipStartTime = selectedClip.startTime ?? 0;
    const clipEndTime = selectedClip.endTime ?? videoRef.current.duration;
    const relativeTime = Math.max(0, videoCurrentTime - clipStartTime);
    
    console.log("🎬 VideoPreview: Time update - video time:", videoCurrentTime, "relative time:", relativeTime);
    setCurrentTime(relativeTime);

    // Check for clip ending
    if (clipEndTime && videoCurrentTime >= (clipEndTime - 0.1)) {
      console.log("🎬 VideoPreview: Clip ending detected");
      handleClipEnded();
    }
  }, [isAudioMaster, selectedClip, setCurrentTime, handleClipEnded]);

  const handleVideoEnded = React.useCallback(() => {
    console.log("🎬 VideoPreview: Video ended, isAudioMaster:", isAudioMaster);
    if (!isAudioMaster) {
      handleClipEnded();
    }
  }, [isAudioMaster, handleClipEnded]);

  const handleLoadedMetadata = React.useCallback(() => {
    console.log("🎬 VideoPreview: Video metadata loaded");
    if (videoRef.current && selectedClip) {
      const videoDuration = videoRef.current.duration || 0;
      console.log("🎬 VideoPreview: Video duration:", videoDuration);

      if (!selectedClip.originalDuration || selectedClip.originalDuration === 0) {
        console.log("🎬 VideoPreview: Setting initial clip duration");
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

        videoRef.current.currentTime = clipStartTime;
        setClipDisplayDuration(clipDuration || videoDuration);
        setCurrentTime(0);
        console.log("🎬 VideoPreview: Set clip duration:", clipDuration);
      }
    }
  }, [selectedClip, updateClip, setCurrentTime]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedClip || clipDisplayDuration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * clipDisplayDuration;
    
    console.log("🎬 VideoPreview: Progress bar clicked, seeking to:", newTime);
    seekToTime(newTime);
  };

  // Handle clip changes
  React.useEffect(() => {
    console.log("🎬 VideoPreview: Clip change effect triggered, selectedClip:", selectedClip?.id);
    
    if (!videoRef.current || !selectedClip) {
      console.log("🎬 VideoPreview: No video ref or selected clip");
      return;
    }

    const video = videoRef.current;
    const clipStartTime = selectedClip.startTime ?? 0;
    const clipEndTime = selectedClip.endTime ?? selectedClip.originalDuration;
    const clipDuration = (clipEndTime || 0) - clipStartTime;

    console.log("🎬 VideoPreview: Setting up clip - start:", clipStartTime, "end:", clipEndTime, "duration:", clipDuration);

    // Set display duration
    setClipDisplayDuration(clipDuration > 0 ? clipDuration : (video.duration || 8));
    setCurrentTime(0);

    // Handle video source changes
    if (video.src !== selectedClip.src) {
      console.log("🎬 VideoPreview: Changing video source from", video.src, "to", selectedClip.src);
      video.src = selectedClip.src;
      video.load();
    } else {
      console.log("🎬 VideoPreview: Same source, just updating time");
      video.currentTime = clipStartTime;
    }
  }, [selectedClip?.id, selectedClip?.src, setCurrentTime]);

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

  // Determine play state
  const videoIsPlaying = videoRef.current ? !videoRef.current.paused && !videoRef.current.ended : false;
  const shouldShowPlayButton = !videoIsPlaying;

  console.log("🎬 VideoPreview: Render state - videoIsPlaying:", videoIsPlaying, "shouldShowPlayButton:", shouldShowPlayButton);

  return (
    <div ref={previewContainerRef} className="bg-card border border-border rounded-lg overflow-hidden grid grid-rows-[1fr_auto] h-full">
      <div className="bg-black flex items-center justify-center relative group overflow-hidden">
        {selectedClip ? (
          <>
            <video
              ref={videoRef}
              src={selectedClip.src}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              onClick={togglePlay}
              preload="metadata"
              playsInline
              muted={false}
            />
            {shouldShowPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
                  onClick={togglePlay}
                >
                  <Play className="h-8 w-8 ml-1" />
                </Button>
              </div>
            )}
          </>
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
            {videoIsPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
