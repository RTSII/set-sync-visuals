
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { MediaClip } from '@/types';

interface VideoPreviewPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  selectedClip: MediaClip | null;
  shouldShowPlayButton: boolean;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onVideoEnded: () => void;
  onTogglePlay: () => void;
}

const VideoPreviewPlayer = ({
  videoRef,
  selectedClip,
  shouldShowPlayButton,
  onTimeUpdate,
  onLoadedMetadata,
  onVideoEnded,
  onTogglePlay
}: VideoPreviewPlayerProps) => {
  return (
    <div className="bg-black flex items-center justify-center relative group overflow-hidden">
      {selectedClip ? (
        <>
          <video
            ref={videoRef}
            src={selectedClip.src}
            className="w-full h-full object-contain"
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onVideoEnded}
            onClick={onTogglePlay}
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
                onClick={onTogglePlay}
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
  );
};

export default VideoPreviewPlayer;
