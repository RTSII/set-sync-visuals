import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Plus, Minus, AudioWaveform, Video, Download, Loader2, GitMerge, MapPin } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { useEditorStore } from "@/lib/store";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { exportVideo } from "@/lib/export";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { Transition } from "@/types";

const Timeline = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const { audioRef } = useEditor();
  const { 
    timelineClips, 
    setTimelineClips,
    updateClip,
    addClipToTimeline,
    selectedClip,
    setSelectedClip,
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
    if (waveform.length > 0 && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);
        
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
        context.fillStyle = `hsl(${primaryColor})`;

        const barWidth = width / waveform.length;
        
        waveform.forEach((val, i) => {
            const barHeight = val * height * 1.5; // Amplify for better visibility
            const y = (height - barHeight) / 2;
            context.fillRect(i * barWidth, y, barWidth * 0.9, barHeight); // 0.9 for bar spacing
        });
    }
  }, [waveform]);

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
    <Card className="flex flex-col flex-1">
      {audioSrc && <audio ref={audioRef} src={audioSrc} />}
      <div className="p-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Scissors className="h-4 w-4 mr-2"/>Split</Button>
            <Button variant="secondary" size="sm" onClick={() => addAudioMarker(currentTime)}><MapPin className="h-4 w-4 mr-2"/>Add Marker</Button>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? `Exporting... ${exportProgress}%` : "Export Video"}
            </Button>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">00:01:15:03</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Minus className="h-4 w-4" /></Button>
            <div className="w-24 bg-muted h-1 rounded-full"><div className="w-1/2 bg-primary h-1 rounded-full"></div></div>
            <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
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
            {/* Timeline Ruler */}
            <div className="h-6 flex items-center text-xs text-muted-foreground mb-2">
                {Array.from({length: 8}).map((_, i) => (
                    <div key={i} className="w-[100px] border-l border-border/50 pl-1">{`0:${i*10}`}</div>
                ))}
            </div>
            
            {/* Playhead */}
            <div className="absolute top-6 bottom-0 w-0.5 bg-primary z-10" style={{left: playheadPosition}}>
                <div className="h-2 w-2 rounded-full bg-background border-2 border-primary absolute -top-1 -translate-x-1/2"></div>
            </div>

            {/* Tracks */}
            <div className="space-y-2">
                {/* Audio Track */}
                <div className="h-28 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
                        <AudioWaveform className="h-5 w-5 text-foreground"/>
                    </div>
                    <div className="flex-1 h-full relative bg-muted/30 rounded">
                      {waveform.length > 0 ? (
                        <>
                          <canvas ref={canvasRef} className="w-full h-full" width="1200" height="96"></canvas>
                          {audioMarkers.map((markerTime, index) => {
                            const markerPosition = duration > 0 ? `${(markerTime / duration) * 100}%` : '0%';
                            return (
                              <div
                                key={index}
                                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 cursor-ew-resize group"
                                style={{ left: markerPosition }}
                                onMouseDown={() => setDraggingMarkerIndex(index)}
                              >
                                <div className="absolute -top-1.5 -translate-x-1/2 bg-yellow-400 p-0.5 rounded-full ring-2 ring-background group-hover:scale-125 transition-transform">
                                  <MapPin className="h-3 w-3 text-background" fill="currentColor"/>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-center p-4">
                            <p className="text-muted-foreground text-sm">Upload an audio file from the media library to generate its waveform.</p>
                        </div>
                      )}
                    </div>
                </div>

                {/* Video Track */}
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
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
