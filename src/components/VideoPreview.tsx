
import { Button } from "@/components/ui/button";
import { Play, Pause, Rewind, FastForward, Expand } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import React from 'react';

const VideoPreview = () => {
  const { 
    selectedClip, 
    videoRef, 
    isPlaying, 
    togglePlay,
    jumpToStart,
    jumpToEnd,
    handleClipEnded,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    wasPlaying,
    setWasPlaying,
  } = useEditor();

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (wasPlaying) {
        videoRef.current.play().catch(e => console.error("Autoplay failed", e));
        setWasPlaying(false);
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden grid grid-rows-[1fr_auto] flex-1">
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
            <img
            src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2000&auto=format&fit=crop"
            alt="Video preview"
            className="w-full h-full object-cover"
            />
        )}
        {selectedClip && !isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                <Button size="icon" className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary animate-glow" onClick={togglePlay}>
                    <Play className="h-8 w-8" fill="white" />
                </Button>
            </div>
        )}
      </div>
      <div className="p-2 bg-secondary/20 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={jumpToStart}><Rewind className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={jumpToEnd}><FastForward className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 mx-4">
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${progressPercentage}%`}}></div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <Button variant="ghost" size="icon"><Expand className="h-5 w-5" /></Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
