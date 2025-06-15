
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import React, { useRef, useEffect, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { useEditorStore } from "@/lib/store";
import { toast } from "sonner";
import { exportVideo } from "@/lib/export";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { Transition } from "@/types";
import { TimelineControls, AudioTrack, VideoTrack, TimelineRuler } from './timeline';

const Timeline = () => {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const { audioRef } = useEditor();
  const { 
    timelineClips, 
    setTimelineClips,
    updateClip,
    addClipToTimeline,
    currentTime,
    duration,
    audioSrc,
    waveform,
    audioFile,
    isExporting,
    setIsExporting,
    exportProgress,
    setExportProgress,
    audioMarkers,
    addAudioMarker,
    setAudioMarkers,
  } = useEditorStore();

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const [draggingMarkerIndex, setDraggingMarkerIndex] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    }
  }, [audioSrc]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingMarkerIndex === null || !timelineContainerRef.current || duration === 0) return;
      
      const timelineRect = timelineContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - timelineRect.left;
      const progress = Math.max(0, Math.min(1, relativeX / timelineRect.width));
      const newTime = progress * duration;

      const newMarkers = [...audioMarkers];
      newMarkers[draggingMarkerIndex] = newTime;
      setAudioMarkers(newMarkers.sort((a,b) => a - b));
    };

    const handleMouseUp = () => {
      setDraggingMarkerIndex(null);
    };

    if (draggingMarkerIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingMarkerIndex, audioMarkers, setAudioMarkers, duration]);

  const handleDropOnTimeline = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipData = e.dataTransfer.getData("application/rvj-clip");
    if (clipData) {
        try {
            const clip = JSON.parse(clipData);
            addClipToTimeline(clip);
        } catch (error) {
            console.error("Failed to parse clip data on drop", error);
        }
    }
  };

  const handleTimelineDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;

    setTimelineClips(prevClips => {
        const newClips = [...prevClips];
        const draggedItemContent = newClips.splice(dragItem.current!, 1)[0];
        if (draggedItemContent) {
            newClips.splice(dragOverItem.current!, 0, draggedItemContent);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        return newClips;
    });
  };

  const handleToggleTransition = (clipId: string, currentTransition: Transition | null | undefined) => {
    if (currentTransition) {
      updateClip(clipId, { transition: null });
    } else {
      // Add a default 1s crossfade transition
      updateClip(clipId, { transition: { type: 'crossfade', duration: 1 } });
    }
  };

  const handleExport = async () => {
    if (timelineClips.length === 0) {
      toast.error("Cannot export.", { description: "Please add at least one video clip to the timeline." });
      return;
    }
    if (!audioFile) {
      toast.error("Cannot export.", { description: "Please add an audio track." });
      return;
    }

    if (timelineClips.some(c => c.transition)) {
      toast.info("Transitions are coming soon!", { 
        description: "Your video will be exported without transitions for now." 
      });
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const outputBlob = await exportVideo({
        ffmpeg: ffmpegRef.current,
        timelineClips,
        audioFile,
        setExportProgress,
      });

      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rVJ-export.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Export complete!", { description: "Your video has been downloaded." });

    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed.", { 
        description: "An error occurred during export. This can happen if video clips have different resolutions or formats. Check the console for details." 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const playheadPosition = duration > 0 ? `${(currentTime / duration) * 100}%` : '0%';

  return (
    <Card className="flex flex-col h-full">
      {audioSrc && <audio ref={audioRef} src={audioSrc} />}
      <TimelineControls handleExport={handleExport} />
      <CardContent className="p-4 flex-1 overflow-x-auto">
        {isExporting && (
            <div className="my-2 space-y-1">
              <p className="text-sm text-muted-foreground text-center">Processing video, please wait...</p>
              <Progress value={exportProgress} className="w-full" />
            </div>
        )}
        <div 
          className="relative min-w-[800px]"
          onDrop={handleDropOnTimeline}
          onDragOver={(e) => e.preventDefault()}
          ref={timelineContainerRef}
        >
            <TimelineRuler />
            
            {/* Playhead */}
            <div className="absolute top-6 bottom-0 w-0.5 bg-primary z-10" style={{left: playheadPosition}}>
                <div className="h-2 w-2 rounded-full bg-background border-2 border-primary absolute -top-1 -translate-x-1/2"></div>
            </div>

            {/* Tracks */}
            <div className="space-y-2">
                <AudioTrack duration={duration} setDraggingMarkerIndex={setDraggingMarkerIndex} />
                <VideoTrack
                  dragItem={dragItem}
                  dragOverItem={dragOverItem}
                  handleTimelineDragSort={handleTimelineDragSort}
                  handleToggleTransition={handleToggleTransition}
                />
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
