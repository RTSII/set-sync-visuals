import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Plus, Minus, AudioWaveform, Video, Upload } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";

const Timeline = () => {
  const [waveform, setWaveform] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { timelineClips, setTimelineClips, addClipToTimeline } = useEditor();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      
      const canvasWidth = 1200; // Corresponds to canvas width attribute
      const samples = Math.floor(channelData.length / canvasWidth);
      const waveformData: number[] = [];
      
      for (let i = 0; i < canvasWidth; i++) {
          const start = samples * i;
          let max = 0;
          const end = start + samples;
          for (let j = start; j < end; j++) {
              const val = Math.abs(channelData[j] ?? 0);
              if (val > max) {
                  max = val;
              }
          }
          waveformData.push(max);
      }
      setWaveform(waveformData);
    } catch(e) {
      console.error("Error processing audio file:", e);
      // In a real app, you'd show a toast notification here.
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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

  return (
    <Card className="flex-1 flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Scissors className="h-4 w-4 mr-2"/>Split</Button>
            <Button variant="secondary" size="sm" onClick={handleUploadClick}>
              <Upload className="h-4 w-4 mr-2"/> Upload Audio
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
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
        <div 
          className="relative min-w-[1200px]"
          onDrop={handleDropOnTimeline}
          onDragOver={(e) => e.preventDefault()}
        >
            {/* Timeline Ruler */}
            <div className="h-6 flex items-center text-xs text-muted-foreground mb-2">
                {Array.from({length: 12}).map((_, i) => (
                    <div key={i} className="w-[100px] border-l border-border/50 pl-1">{`0:${i*10}`}</div>
                ))}
            </div>
            
            {/* Playhead */}
            <div className="absolute top-6 bottom-0 w-0.5 bg-primary z-10" style={{left: '25%'}}>
                <div className="h-2 w-2 rounded-full bg-background border-2 border-primary absolute -top-1 -translate-x-1/2"></div>
            </div>

            {/* Tracks */}
            <div className="space-y-2">
                {/* Audio Track */}
                <div className="h-20 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
                        <AudioWaveform className="h-5 w-5 text-foreground"/>
                    </div>
                    <div className="flex-1 h-full relative bg-muted/30 rounded">
                      {waveform.length > 0 ? (
                        <canvas ref={canvasRef} className="w-full h-full" width="1200" height="80"></canvas>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-center p-4">
                            <p className="text-muted-foreground text-sm">Upload an audio file to generate its waveform and start syncing.</p>
                        </div>
                      )}
                    </div>
                </div>

                {/* Video Track */}
                <div className="h-20 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
                        <Video className="h-5 w-5 text-foreground"/>
                    </div>
                    <div className="flex-1 h-full flex items-center gap-1">
                        {timelineClips.map((clip, index) => (
                           <div
                             key={clip.id}
                             className="h-full aspect-video rounded-md relative overflow-hidden cursor-grab active:cursor-grabbing group"
                             draggable
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
