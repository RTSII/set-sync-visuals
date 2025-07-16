
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Video, GitMerge } from "lucide-react";
import { Transition, MediaClip } from "@/types";

interface VideoTrackProps {
  dragItem: React.MutableRefObject<number | null>;
  dragOverItem: React.MutableRefObject<number | null>;
  handleTimelineDragSort: () => void;
  handleToggleTransition: (clipId: string, currentTransition: Transition | null | undefined) => void;
}

interface ThumbnailCache {
  [key: string]: string;
}

const PIXELS_PER_SECOND = 10;
const MIN_CLIP_DURATION = 0.5;
const STANDARD_CLIP_WIDTH = 80;

const VideoTrack: React.FC<VideoTrackProps> = ({
  dragItem,
  dragOverItem,
  handleTimelineDragSort,
  handleToggleTransition,
}) => {
  const { timelineClips, selectedClip, setSelectedClip, trimmingClipId, setTrimmingClipId, updateClip } = useEditorStore();
  const [draggingHandle, setDraggingHandle] = useState<'left' | 'right' | null>(null);
  const dragClipRef = useRef<MediaClip | null>(null);
  const dragStartRef = useRef({ x: 0, startTime: 0, endTime: 0 });
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>({});
  const generatingThumbnails = useRef<Set<string>>(new Set());
  const lastClipCount = useRef<number>(0);

  const handleTrimMouseDown = (e: React.MouseEvent, clip: MediaClip, handle: 'left' | 'right') => {
    e.stopPropagation();
    setDraggingHandle(handle);
    dragClipRef.current = clip;
    dragStartRef.current = { x: e.clientX, startTime: clip.startTime ?? 0, endTime: clip.endTime ?? clip.originalDuration ?? 0 };
  };

  // Optimized thumbnail generation function - only generate when really needed
  const generateThumbnail = useCallback((videoSrc: string, clipId: string) => {
    // Prevent duplicate generation
    if (thumbnailCache[clipId] || generatingThumbnails.current.has(clipId)) {
      return;
    }

    console.log(`Generating thumbnail for clip: ${clipId}`);
    generatingThumbnails.current.add(clipId);

    const video = document.createElement('video');
    video.crossOrigin = "anonymous";
    video.src = videoSrc;
    video.muted = true;
    video.preload = "metadata";

    const cleanup = () => {
      generatingThumbnails.current.delete(clipId);
      video.remove();
    };

    const timeoutId = setTimeout(() => {
      console.log(`Thumbnail generation timeout for clip: ${clipId}`);
      setThumbnailCache(prev => ({
        ...prev,
        [clipId]: "data:,"
      }));
      cleanup();
    }, 5000);

    video.onloadedmetadata = () => {
      console.log(`Video metadata loaded for thumbnail: ${clipId}, duration: ${video.duration}`);
      video.currentTime = Math.min(0.5, video.duration / 3);
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          console.log(`Thumbnail generated successfully for clip: ${clipId}`);
          setThumbnailCache(prev => ({
            ...prev,
            [clipId]: thumbnailUrl
          }));
        } else {
          console.error(`Failed to get canvas context or video dimensions for clip: ${clipId}`);
          setThumbnailCache(prev => ({ ...prev, [clipId]: "data:," }));
        }
      } catch (err) {
        console.error(`Error generating thumbnail for clip ${clipId}:`, err);
        setThumbnailCache(prev => ({ ...prev, [clipId]: "data:," }));
      } finally {
        cleanup();
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      console.error(`Error loading video for thumbnail: ${clipId}`);
      setThumbnailCache(prev => ({ ...prev, [clipId]: "data:," }));
      cleanup();
    };
  }, [thumbnailCache]);

  // Only generate thumbnails when clip count changes or new clips are added
  useEffect(() => {
    if (timelineClips.length !== lastClipCount.current) {
      console.log("Checking for clips needing thumbnails, total clips:", timelineClips.length);
      lastClipCount.current = timelineClips.length;
      
      // Only generate for clips that truly need thumbnails
      const clipsNeedingThumbnails = timelineClips.filter(
        clip => !thumbnailCache[clip.id] && !generatingThumbnails.current.has(clip.id) && clip.src
      );
      
      // Generate thumbnails with a small delay to prevent flooding
      clipsNeedingThumbnails.forEach((clip, index) => {
        setTimeout(() => {
          generateThumbnail(clip.src, clip.id);
        }, index * 100); // Stagger thumbnail generation
      });
    }
  }, [timelineClips.length, thumbnailCache, generateThumbnail]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingHandle || !dragClipRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaTime = deltaX / PIXELS_PER_SECOND;
      const clip = dragClipRef.current;

      if (draggingHandle === 'left') {
        const newStartTime = Math.max(0, dragStartRef.current.startTime + deltaTime);
        if (newStartTime < dragStartRef.current.endTime - MIN_CLIP_DURATION) {
          updateClip(clip.id, { startTime: newStartTime });
        }
      } else {
        const newEndTime = Math.min(clip.originalDuration ?? Infinity, dragStartRef.current.endTime + deltaTime);
        if (newEndTime > (clip.startTime ?? 0) + MIN_CLIP_DURATION) {
          updateClip(clip.id, { endTime: newEndTime });
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingHandle(null);
      dragClipRef.current = null;
    };

    if (draggingHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHandle, updateClip]);

  const handleDoubleClick = (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    setTrimmingClipId(trimmingClipId === clipId ? null : clipId);
  }

  return (
    <div className="h-8 bg-secondary/30 rounded-md p-1 flex items-center gap-0.5">
      <div className="w-4 h-full flex items-center justify-center bg-muted rounded flex-shrink-0">
        <Video className="h-2 w-2 text-foreground" />
      </div>
      <div className="flex-1 h-full flex items-center gap-0.5">
        {timelineClips.map((clip, index) => (
          <React.Fragment key={clip.id}>
            {/* Show transition button only if the clip has a transition */}
            {index > 0 && clip.transition && (
              <div className="w-2 h-full flex items-center justify-center flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-2 h-2 rounded-full hover:bg-primary/20"
                  onClick={() => handleToggleTransition(clip.id, clip.transition)}
                >
                  <GitMerge className="h-1 w-1 text-primary" />
                </Button>
              </div>
            )}
            <div
              className="relative h-full flex-shrink-0 group"
              style={{ width: `${STANDARD_CLIP_WIDTH}px` }}
            >
              <div
                className={`w-full h-full rounded-sm relative overflow-hidden cursor-pointer active:cursor-grabbing border-2 ${selectedClip?.id === clip.id && !trimmingClipId ? 'border-primary bg-primary/20' : 'border-muted bg-muted'} hover:bg-primary/10 transition-colors`}
                draggable
                onClick={() => setSelectedClip(clip)}
                onDoubleClick={(e) => handleDoubleClick(e, clip.id)}
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleTimelineDragSort}
                onDragOver={(e) => e.stopPropagation()}
              >
                {/* Show thumbnail if available, otherwise show video icon */}
                {thumbnailCache[clip.id] && thumbnailCache[clip.id] !== "data:," ? (
                  <img
                    src={thumbnailCache[clip.id]}
                    alt={clip.file.name}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error(`Failed to load thumbnail for clip: ${clip.id}`);
                      setThumbnailCache(prev => ({ ...prev, [clip.id]: "data:," }));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <Video className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <p className="absolute bottom-0 left-0 text-[6px] text-foreground bg-background/80 px-0.5 rounded-sm truncate pointer-events-none max-w-full">
                  {clip.file.name}
                </p>
                {/* Add transition button - only show on hover if no transition exists */}
                {index > 0 && !clip.transition && (
                  <div
                    className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTransition(clip.id, null);
                    }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-1.5 h-1.5 rounded-full bg-background/80 hover:bg-primary/20 border"
                      title="Add transition"
                    >
                      <GitMerge className="h-0.5 w-0.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
              {/* Trimming handles */}
              {trimmingClipId === clip.id && (
                <>
                  <div className="absolute inset-0 ring-1 ring-primary ring-offset-1 ring-offset-background rounded-sm pointer-events-none z-10"></div>
                  <div
                    className="absolute -left-0.5 top-0 bottom-0 w-1 bg-primary/80 hover:bg-primary transition-colors cursor-ew-resize z-20 flex items-center justify-center rounded-l-sm"
                    onMouseDown={(e) => handleTrimMouseDown(e, clip, 'left')}
                  >
                    <div className="w-0.5 h-1 bg-primary-foreground/70 rounded-full" />
                  </div>
                  <div
                    className="absolute -right-0.5 top-0 bottom-0 w-1 bg-primary/80 hover:bg-primary transition-colors cursor-ew-resize z-20 flex items-center justify-center rounded-r-sm"
                    onMouseDown={(e) => handleTrimMouseDown(e, clip, 'right')}
                  >
                    <div className="w-0.5 h-1 bg-primary-foreground/70 rounded-full" />
                  </div>
                </>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default VideoTrack;
