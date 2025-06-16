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

export function TimelineControls() {
  //... component code...
}

export function AudioTrack() {
  //... component code...
}

export function VideoTrack() {
  //... component code...
}

export function TimelineRuler() {
  //... component code...
}

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
    selectedClip,
  } = useEditorStore();

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const [draggingMarkerIndex, setDraggingMarkerIndex] = useState<number | null>(null);

  // Calculate playhead position based on current clip and time
  const getPlayheadPosition = () => {
    if (!selectedClip || timelineClips.length === 0) return '0%';

    const currentClipIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    if (currentClipIndex === -1) return '0%';

    // Calculate total duration of clips before current clip
    let totalDurationBefore = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timelineClips[i];
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      totalDurationBefore += clipDuration;
    }

    // Add current time within current clip
    const totalCurrentTime = totalDurationBefore + currentTime;

    // Calculate total duration of all clips
    const totalDuration = timelineClips.reduce((acc, clip) => {
      const clipDuration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      return acc + clipDuration;
    }, 0);

    if (totalDuration === 0) return '0%';

    return `${Math.min(100, (totalCurrentTime / totalDuration) * 100)}%`;
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

    const totalDuration = timelineClips.reduce((acc, clip) => {
      const duration = (clip.endTime ?? clip.originalDuration ?? 0) - (clip.startTime ?? 0);
      return acc + Math.max(0, duration);
    }, 0);

    if (totalDuration > 300) { // Notify for videos longer than 5 minutes
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
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none overflow-hidden">
      {audioSrc && <audio ref={audioRef} src={audioSrc} />}
      <TimelineControls handleExport={handleExport} />
      <CardContent className="p-2 pt-1 flex-1 min-h-0 overflow-hidden">
        {isExporting && (
          <div className="mb-1 space-y-1">
            <p className="text-xs text-muted-foreground text-center">Processing video, please wait...</p>
            <Progress value={exportProgress} className="w-full h-1" />
          </div>
        )}
        <div
          className="relative min-w-[600px] h-full overflow-x-auto overflow-y-hidden"
          onDrop={handleDropOnTimeline}
          onDragOver={(e) => e.preventDefault()}
          ref={timelineContainerRef}
        >
          <TimelineRuler />

          {/* Enhanced playhead */}
          <div className="absolute top-4 bottom-0 w-0.5 bg-primary z-30 shadow-lg" style={{ left: playheadPosition }}>
            <div className="h-2 w-2 rounded-full bg-primary border-2 border-background absolute -top-1 -translate-x-1/2 shadow-lg"></div>
            <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/80 to-primary/60"></div>
          </div>

          {/* Tracks */}
          <div className="space-y-1 mt-1">
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
