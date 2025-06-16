
import { Button } from "@/components/ui/button";
import { Play, Pause, Rewind, FastForward, Expand } from "lucide-react";
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
  } = useEditor();

  const {
    selectedClip, 
    isPlaying, 
    currentTime,
    setCurrentTime,
    wasPlaying,
    setWasPlaying,
    updateClip,
    timelineClips
  } = useEditorStore();

  const [clipDisplayDuration, setClipDisplayDuration] = React.useState(0);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedClip) {
      const absoluteTime = videoRef.current.currentTime;
      const clipStartTime = selectedClip.startTime ?? 0;
      const clipEndTime = selectedClip.endTime ?? videoRef.current.duration;
      
      console.log(`Time update - absolute: ${absoluteTime}, start: ${clipStartTime}, end: ${clipEndTime}`);
      
      // Check if we've reached the end of the current clip
      if (absoluteTime >= clipEndTime - 0.1) { // Small buffer to prevent timing issues
        console.log("Clip ended based on time, triggering handleClipEnded");
        handleClipEnded();
      } else {
        // Update the display time relative to clip start
        const relativeTime = absoluteTime - clipStartTime;
        setCurrentTime(Math.max(0, relativeTime));
      }
    }
  };

  const handleLoadedMetadata = () => {
    console.log("Video metadata loaded for clip:", selectedClip?.id);
    if (videoRef.current && selectedClip) {
      const videoDuration = videoRef.current.duration;
      
      // Initialize clip properties if not set
      if (!selectedClip.originalDuration) {
        console.log("Initializing clip duration:", videoDuration);
        updateClip(selectedClip.id, {
          startTime: 0,
          endTime: videoDuration,
          originalDuration: videoDuration,
        });
        setClipDisplayDuration(videoDuration);
      } else {
        // Set up playback for an existing clip
        const clipStartTime = selectedClip.startTime ?? 0;
        const clipEndTime = selectedClip.endTime ?? videoDuration;
        const clipDuration = clipEndTime - clipStartTime;
        
        console.log("Setting up clip playback:", { clipStartTime, clipEndTime, clipDuration });
        videoRef.current.currentTime = clipStartTime;
        setClipDisplayDuration(clipDuration);
        setCurrentTime(0);
        
        // Auto-play if this was triggered by clip switching
        if (wasPlaying) {
          console.log("Auto-playing next clip");
          setTimeout(() => {
            videoRef.current?.play().catch(e => console.error("Autoplay failed", e));
          }, 100);
          setWasPlaying(false);
        }
      }
    }
  };

  const handleVideoEnded = () => {
    console.log("Video ended event triggered");
    handleClipEnded();
  };

  React.useEffect(() => {
    // React to clip changes and ensure proper setup
    if (videoRef.current && selectedClip && selectedClip.originalDuration) {
      const clipStartTime = selectedClip.startTime ?? 0;
      const clipEndTime = selectedClip.endTime ?? selectedClip.originalDuration;
      const clipDuration = clipEndTime - clipStartTime;
      
      console.log("Clip changed, setting up:", { clipId: selectedClip.id, clipStartTime, clipDuration });
      videoRef.current.currentTime = clipStartTime;
      setClipDisplayDuration(clipDuration);
      setCurrentTime(0);
    }
  }, [selectedClip?.id, selectedClip?.startTime, selectedClip?.endTime]);

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

  // Get current clip position for display
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
        {/* Only show play button when NOT playing and when paused/stopped */}
        {selectedClip && !isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <Button size="icon" className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary animate-glow pointer-events-auto" onClick={togglePlay}>
                    <Play className="h-8 w-8" fill="white" />
                </Button>
            </div>
        )}
      </div>
      <div className="p-2 bg-secondary/20 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={jumpToStart} title="Jump to clip start"><Rewind className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={togglePlay} title="Play/Pause (Space)">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={jumpToEnd} title="Jump to clip end"><FastForward className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 mx-4">
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-100" style={{ width: `${progressPercentage}%`}}></div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{formatTime(currentTime)} / {formatTime(clipDisplayDuration)}</span>
            {totalClips > 0 && (
              <span className="text-xs text-muted-foreground">({currentClipIndex}/{totalClips})</span>
            )}
            <Button variant="ghost" size="icon" onClick={toggleFullScreen} title="Fullscreen"><Expand className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
