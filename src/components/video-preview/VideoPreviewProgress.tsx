
import React from 'react';

interface VideoPreviewProgressProps {
  progressPercentage: number;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const VideoPreviewProgress = ({ progressPercentage, onProgressClick }: VideoPreviewProgressProps) => {
  return (
    <div className="flex-1 mx-4">
      <div 
        className="w-full bg-muted h-1.5 rounded-full overflow-hidden cursor-pointer"
        onClick={onProgressClick}
      >
        <div className="bg-primary h-full transition-all duration-100" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
};

export default VideoPreviewProgress;
