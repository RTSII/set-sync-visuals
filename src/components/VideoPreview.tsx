
import React from 'react';
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useVideoPreviewState } from "@/hooks/useVideoPreviewState";
import VideoPreviewPlayer from "./video-preview/VideoPreviewPlayer";
import VideoPreviewControls from "./video-preview/VideoPreviewControls";

const VideoPreview = () => {
  const previewContainerRef = React.useRef<HTMLDivElement>(null);
  
  const {
    videoRef,
    selectedClip,
    clipDisplayDuration,
    currentTime,
    currentClipIndex,
    totalClips,
    videoIsPlaying,
    shouldShowPlayButton,
    progressPercentage,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleVideoEnded,
    togglePlay,
    jumpToStart,
    jumpToEnd,
    seekToTime
  } = useVideoPreviewState();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedClip || clipDisplayDuration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * clipDisplayDuration;
    
    console.log("🎬 PROGRESS-CLICK: Seeking to time:", newTime);
    seekToTime(newTime);
  };

  return (
    <div ref={previewContainerRef} className="bg-card border border-border rounded-lg overflow-hidden grid grid-rows-[1fr_auto] h-full">
      <VideoPreviewPlayer
        videoRef={videoRef}
        selectedClip={selectedClip}
        shouldShowPlayButton={shouldShowPlayButton}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onVideoEnded={handleVideoEnded}
        onTogglePlay={togglePlay}
      />
      <VideoPreviewControls
        videoIsPlaying={videoIsPlaying}
        currentTime={currentTime}
        clipDisplayDuration={clipDisplayDuration}
        currentClipIndex={currentClipIndex}
        totalClips={totalClips}
        progressPercentage={progressPercentage}
        onJumpToStart={jumpToStart}
        onTogglePlay={togglePlay}
        onJumpToEnd={jumpToEnd}
        onProgressClick={handleProgressBarClick}
        previewContainerRef={previewContainerRef}
      />
    </div>
  );
};

export default VideoPreview;
