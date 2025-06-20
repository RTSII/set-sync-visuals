
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pause, Play, Rewind, FastForward, Expand } from "lucide-react";
import VideoPreviewProgress from "./VideoPreviewProgress";
import { toast } from "sonner";

interface VideoPreviewControlsProps {
  videoIsPlaying: boolean;
  currentTime: number;
  clipDisplayDuration: number;
  currentClipIndex: number;
  totalClips: number;
  progressPercentage: number;
  onJumpToStart: () => void;
  onTogglePlay: () => void;
  onJumpToEnd: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  previewContainerRef: React.RefObject<HTMLDivElement>;
}

const VideoPreviewControls = ({
  videoIsPlaying,
  currentTime,
  clipDisplayDuration,
  currentClipIndex,
  totalClips,
  progressPercentage,
  onJumpToStart,
  onTogglePlay,
  onJumpToEnd,
  onProgressClick,
  previewContainerRef
}: VideoPreviewControlsProps) => {
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

  return (
    <div className="p-2 bg-secondary/20 border-t border-border flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onJumpToStart} title="Jump to project start">
          <Rewind className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onTogglePlay} title="Play/Pause (Space)">
          {videoIsPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onJumpToEnd} title="Jump to clip end">
          <FastForward className="h-4 w-4" />
        </Button>
      </div>
      <VideoPreviewProgress 
        progressPercentage={progressPercentage}
        onProgressClick={onProgressClick}
      />
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
  );
};

export default VideoPreviewControls;
