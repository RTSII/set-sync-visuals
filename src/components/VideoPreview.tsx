
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Rewind, FastForward, Expand } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVideoPreloader } from "@/hooks/useVideoPreloader";
import { useEditor } from "@/context/EditorContext";
import { useEditorStore } from "@/lib/store";
import { toast } from "sonner";

const VideoPreview = () => {
  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  const {
    videoRef,
    togglePlay,
    jumpToStart,
    jumpToEnd,
    handleClipEnded,
    seekToTime
  } = useEditor();

  const {
    selectedClip,
    isPlaying,
    currentTime,
    setCurrentTime,
    updateClip,
    timelineClips,
    absoluteTimelinePosition,
    setAbsoluteTimelinePosition,
    isAudioMaster
  } = useEditorStore();

  const [clipDisplayDuration, setClipDisplayDuration] = React.useState(0);
  const [isBuffering, setIsBuffering] = React.useState(false);
  const isTransitioning = React.useRef(false);
  const transitionTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Enable keyboard shortcuts and video preloading
  useKeyboardShortcuts();
  const { isPreloaded } = useVideoPreloader(timelineClips, selectedClip?.id);

  const handleTimeUpdate = () => {
    // Only handle time updates for display purposes - clip transitions are handled by hooks
    if (videoRef.current && selectedClip && !isTransitioning.current) {
      const videoCurrentTime = videoRef.current.currentTime;
      const clipStartTime = selectedClip.startTime ?? 0;
      const relativeTime = Math.max(0, videoCurrentTime - clipStartTime);
      setCurrentTime(relativeTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && selectedClip) {
      const videoDuration = videoRef.current.duration || 0;
      console.log("🎬 METADATA: Video loaded for clip:", selectedClip.id, "duration:", videoDuration);

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

        videoRef.current.currentTime = clipStartTime;
        setClipDisplayDuration(clipDuration || videoDuration);
        setCurrentTime(0);
      }
    }
  };

  // Video ended handler removed - clip transitions are handled by useClipTransition and useAudioTimeSync hooks

  // Enhanced clip change handler
  React.useEffect(() => {
    if (videoRef.current && selectedClip) {
      const clipStartTime = selectedClip.startTime ?? 0;
      const clipEndTime = selectedClip.endTime ?? selectedClip.originalDuration;
      const clipDuration = (clipEndTime || 0) - clipStartTime;

      console.log("🎬 CLIP-CHANGE: Selected clip changed to:", selectedClip.id);
      console.log("🎬 CLIP-CHANGE: Clip start time:", clipStartTime, "duration:", clipDuration);
      
      setClipDisplayDuration(clipDuration > 0 ? clipDuration : (videoRef.current.duration || 8));
      setCurrentTime(0);

      if (!isTransitioning.current) {
        console.log("🎬 CLIP-CHANGE: Setting video time to clip start:", clipStartTime);
        videoRef.current.currentTime = clipStartTime;
      }
    }
  }, [selectedClip?.id, selectedClip?.startTime, selectedClip?.endTime, setCurrentTime]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedClip || clipDisplayDuration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * clipDisplayDuration;
    
    console.log("🎬 PROGRESS-CLICK: Seeking to time:", newTime);
    seekToTime(newTime);
  };

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

  const currentClipIndex = selectedClip ? timelineClips.findIndex(c => c.id === selectedClip.id) + 1 : 0;
  const totalClips = timelineClips.length;
  const videoIsPlaying = videoRef.current ? !videoRef.current.paused : false;
  const shouldShowPlayButton = !videoIsPlaying && !isTransitioning.current;
  const progressPercentage = clipDisplayDuration > 0 ? Math.min(100, (currentTime / clipDisplayDuration) * 100) : 0;

  return (
    <div ref={previewContainerRef} className="bg-card border border-border rounded-lg overflow-hidden grid grid-rows-[1fr_auto] h-full">
      <div className="bg-black flex items-center justify-center relative group overflow-hidden min-h-0">
        {selectedClip ? (
          <>
            <video
              ref={videoRef}
              src={selectedClip.src}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              
              onClick={togglePlay}
              preload="metadata"
              playsInline
              muted={false}
              key={selectedClip.id}
              onWaiting={() => {
                console.log("🎬 BUFFER: Video buffering...");
                setIsBuffering(true);
              }}
              onCanPlayThrough={() => {
                console.log("🎬 BUFFER: Video ready to play through");
                setIsBuffering(false);
              }}
              onLoadStart={() => console.log("🎬 BUFFER: Video load started")}
              onProgress={() => console.log("🎬 BUFFER: Video loading progress")}
            />
            {/* Loading/Buffering Indicator */}
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            
            {/* Preload Status Indicator */}
            {selectedClip && (
              <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                <div className={`w-2 h-2 rounded-full ${isPreloaded(selectedClip.id) ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                {isPreloaded(selectedClip.id) ? 'Ready' : 'Loading'}
              </div>
            )}

            {shouldShowPlayButton && !isBuffering && (
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
              <p className="text-sm">Use Space to play/pause, J/L for -10s/+5s, ←/→ for -5s/+5s</p>
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
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(currentTime)} / {formatTime(clipDisplayDuration)}
          </span>
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
