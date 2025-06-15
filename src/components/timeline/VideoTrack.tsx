
import React from 'react';
import { useEditorStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Video, GitMerge } from "lucide-react";
import { Transition } from "@/types";

interface VideoTrackProps {
  dragItem: React.MutableRefObject<number | null>;
  dragOverItem: React.MutableRefObject<number | null>;
  handleTimelineDragSort: () => void;
  handleToggleTransition: (clipId: string, currentTransition: Transition | null | undefined) => void;
}

const VideoTrack: React.FC<VideoTrackProps> = ({
  dragItem,
  dragOverItem,
  handleTimelineDragSort,
  handleToggleTransition,
}) => {
  const { timelineClips, selectedClip, setSelectedClip } = useEditorStore();

  return (
    <div className="h-28 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
      <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
          <Video className="h-5 w-5 text-foreground"/>
      </div>
      <div className="flex-1 h-full flex items-center">
          {timelineClips.map((clip, index) => (
             <React.Fragment key={clip.id}>
              {index > 0 && (
                <div className="w-8 h-full flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 rounded-full hover:bg-primary/20"
                    onClick={() => handleToggleTransition(clip.id, clip.transition)}
                  >
                    <GitMerge className={`h-4 w-4 transition-colors ${clip.transition ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
              )}
              <div
               className={`h-full aspect-video rounded-md relative overflow-hidden cursor-pointer active:cursor-grabbing group ${selectedClip?.id === clip.id ? 'ring-2 ring-primary ring-offset-background' : ''}`}
               draggable
               onClick={() => setSelectedClip(clip)}
               onDragStart={() => (dragItem.current = index)}
               onDragEnter={() => (dragOverItem.current = index)}
               onDragEnd={handleTimelineDragSort}
               onDragOver={(e) => e.stopPropagation()}
              >
                <video src={clip.src} className="w-full h-full object-cover pointer-events-none" muted />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <p className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded-sm truncate pointer-events-none max-w-full">
                    {clip.file.name}
                </p>
              </div>
             </React.Fragment>
          ))}
      </div>
    </div>
  );
};

export default VideoTrack;
