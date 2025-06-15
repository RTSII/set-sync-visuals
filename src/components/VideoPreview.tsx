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
  } = useEditorStore();

  const [clipDisplayDuration, setClipDisplayDuration] = React.useState(0);
  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleTimeUpdate = () => {
    if (videoRef.current && selectedClip) {
      const absoluteTime = videoRef.current.currentTime;
      if (absoluteTime >= (selectedClip.endTime ?? videoRef.current.duration)) {
        videoRef.current.pause();
        setCurrentTime(clipDisplayDuration);
        handleClipEnded();
      } else {
        setCurrentTime(absoluteTime - (selectedClip.startTime ?? 0));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && selectedClip) {
      const videoDuration = videoRef.current.duration;
      // If clip just added, populate its duration properties
      if (!selectedClip.originalDuration) {
        updateClip(selectedClip.id, {
          startTime: 0,
          endTime: videoDuration,
          originalDuration: videoDuration,
        });
      } else {
        // For subsequent loads of an already-initialized clip
        videoRef.current.currentTime = selectedClip.startTime ?? 0;
        setClipDisplayDuration((selectedClip.endTime ?? videoDuration) - (selectedClip.startTime ?? 0));
        setCurrentTime(0); // Reset playhead for this clip
        if (wasPlaying) {
          videoRef.current.play().catch(e => console.error("Autoplay failed", e));
          setWasPlaying(false);
        }
      }
    }
  };

  React.useEffect(() => {
    // Effect to react to store updates from handleLoadedMetadata
    if (videoRef.current && selectedClip && (selectedClip.originalDuration ?? 0) > 0) {
      const videoDuration = videoRef.current.duration;
      videoRef.current.currentTime = selectedClip.startTime ?? 0;
      setClipDisplayDuration((selectedClip.endTime ?? videoDuration) - (selectedClip.startTime ?? 0));
      setCurrentTime(0);
    }
  }, [selectedClip?.id, selectedClip?.endTime, selectedClip?.startTime, selectedClip?.originalDuration]);

  const jumpToStart = () => {
    if (videoRef.current && selectedClip) {
      videoRef.current.currentTime = selectedClip.startTime ?? 0;
      setCurrentTime(0);
    }
  };

  const jumpToEnd = () => {
    if (videoRef.current && selectedClip) {
      const newTime = selectedClip.endTime ?? videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime - (selectedClip.startTime ?? 0));
    }
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

  const progressPercentage = clipDisplayDuration > 0 ? (currentTime / clipDisplayDuration) * 100 : 0;

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
                onEnded={handleClipEnded}
                onClick={togglePlay}
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
          <Button variant="ghost" size="icon" onClick={jumpToStart} title="Jump to start"><Rewind className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={togglePlay} title="Play/Pause (Space)">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={jumpToEnd} title="Jump to end"><FastForward className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 mx-4">
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-100" style={{ width: `${progressPercentage}%`}}></div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{formatTime(currentTime)} / {formatTime(clipDisplayDuration)}</span>
            <Button variant="ghost" size="icon" onClick={toggleFullScreen} title="Fullscreen"><Expand className="h-5 w-5" /></Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
