
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import React, { useRef, useEffect, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { useEditorStore } from "@/lib/store";
import { toast } from "sonner";
import { exportVideo } from "@/lib/export";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { Transition } from "@/types";
import { 
  TimelineControls, 
  AudioTrack, 
  VideoTrack, 
  TimelineRuler 
} from './timeline';
import AudioUploader from './AudioUploader';
import WaveformVisualizer from './WaveformVisualizer';
import { encodeWAV } from '@/lib/audioUtils';

const Timeline = () => {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const { audioRef, seekToAbsoluteTime, getAbsoluteTimePosition } = useEditor();
  
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
    selectedClip,
    absoluteTimelinePosition,
    setAudioBuffer,
    audioBuffer,
  } = useEditorStore();

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const [draggingMarkerIndex, setDraggingMarkerIndex] = useState<number | null>(null);
  const [isDraggingProgressBar, setIsDraggingProgressBar] = useState(false);

  // Calculate playhead position based on absolute timeline position
  const getPlayheadPosition = () => {
    if (timelineClips.length === 0) return '0%';

    // Calculate total duration of all clips
    const totalDuration = timelineClips.reduce((acc, clip) => {
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      return acc + clipDuration;
    }, 0);

    if (totalDuration === 0) return '0%';

    // Use absolute timeline position instead of calculating from current clip
    return `${Math.min(100, (absoluteTimelinePosition / totalDuration) * 100)}%`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current || isDraggingProgressBar) return;
    
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    
    // Calculate total duration of all clips
    const totalDuration = timelineClips.reduce((acc, clip) => {
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      return acc + clipDuration;
    }, 0);
    
    if (totalDuration === 0) return;
    
    const targetTime = progress * totalDuration;
    seekToAbsoluteTime(targetTime);
  };

  const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingProgressBar(true);
    handleTimelineClick(e);
  };

  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    }
  }, [audioSrc]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgressBar && timelineContainerRef.current) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        const totalDuration = timelineClips.reduce((acc, clip) => {
          const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
          return acc + clipDuration;
        }, 0);
        
        if (totalDuration > 0) {
          const targetTime = progress * totalDuration;
          seekToAbsoluteTime(targetTime);
        }
      }

      if (draggingMarkerIndex === null || !timelineContainerRef.current || duration === 0) return;

      const timelineRect = timelineContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - timelineRect.left;
      const progress = Math.max(0, Math.min(1, relativeX / timelineRect.width));
      const newTime = progress * duration;

      const newMarkers = [...audioMarkers];
      newMarkers[draggingMarkerIndex] = newTime;
      setAudioMarkers(newMarkers.sort((a, b) => a - b));
    };

    const handleMouseUp = () => {
      setIsDraggingProgressBar(false);
      setDraggingMarkerIndex(null);
    };

    if (isDraggingProgressBar || draggingMarkerIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgressBar, draggingMarkerIndex, audioMarkers, setAudioMarkers, duration, timelineClips, seekToAbsoluteTime]);

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

    const newClips = [...timelineClips];
    const draggedItemContent = newClips.splice(dragItem.current!, 1)[0];
    if (draggedItemContent) {
      newClips.splice(dragOverItem.current!, 0, draggedItemContent);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setTimelineClips(newClips);
  };

  const handleToggleTransition = (clipId: string, currentTransition: Transition | null | undefined) => {
    if (currentTransition) {
      updateClip(clipId, { transition: null });
    } else {
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

    const totalDuration = timelineClips.reduce((acc, clip) => {
      const duration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      return acc + Math.max(0, duration);
    }, 0);

    if (totalDuration > 300) {
      toast.info("Long export started...", {
        description: "Exporting long videos can be memory intensive and may take a while. Please keep this tab open and active.",
        duration: 8000
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

  const playheadPosition = getPlayheadPosition();

  return (
    <Card className="flex flex-col h-full bg-card/50 border border-border/50 shadow-sm overflow-hidden">
      {audioSrc && <audio ref={audioRef} src={audioSrc} />}
      <CardContent className="p-3 pt-2 flex-1 min-h-0 overflow-hidden">
        {isExporting && (
          <div className="mb-3 p-3 bg-secondary/20 border border-border/30 rounded-lg space-y-2">
            <p className="text-sm text-foreground font-medium text-center">Exporting Video...</p>
            <Progress value={exportProgress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground text-center">{Math.round(exportProgress)}% complete</p>
          </div>
        )}
        <div
          className="relative min-w-[600px] h-full overflow-x-auto overflow-y-hidden cursor-pointer bg-background/30 border border-border/30 rounded-lg"
          onDrop={handleDropOnTimeline}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleTimelineClick}
          ref={timelineContainerRef}
        >
          {/* Enhanced Waveform Overlay - Always show when audioBuffer exists */}
          {audioBuffer && (
            <div className="absolute top-4 left-4 right-4 h-20 pointer-events-none z-20 bg-background/10 rounded border border-primary/20">
              <WaveformVisualizer audioBuffer={audioBuffer} />
            </div>
          )}

          {/* Video Track - Expanded height */}
          <div className="mt-1 h-24">
            <VideoTrack
              dragItem={dragItem}
              dragOverItem={dragOverItem}
              handleTimelineDragSort={handleTimelineDragSort}
              handleToggleTransition={handleToggleTransition}
            />
          </div>

          {/* Time Ruler - Positioned between video and audio tracks */}
          <div className="relative">
            <TimelineRuler />
            
            {/* Enhanced playhead with scrubbing capability - Centered over time ruler */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-30 shadow-lg cursor-ew-resize" 
              style={{ left: playheadPosition }}
              onMouseDown={handleProgressBarMouseDown}
            >
              <div className="h-2 w-2 rounded-full bg-primary border-2 border-background absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg cursor-grab active:cursor-grabbing"></div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/80 to-primary/60"></div>
            </div>
          </div>

          {/* Audio Track - Expanded height */}
          <div className="h-20">
            <AudioTrack duration={duration} setDraggingMarkerIndex={setDraggingMarkerIndex} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
