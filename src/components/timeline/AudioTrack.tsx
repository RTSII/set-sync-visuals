
import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { AudioWaveform, MapPin } from 'lucide-react';

interface AudioTrackProps {
  duration: number;
  setDraggingMarkerIndex: (index: number | null) => void;
}

const AudioTrack: React.FC<AudioTrackProps> = ({ duration, setDraggingMarkerIndex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { waveform, audioMarkers } = useEditorStore();

  useEffect(() => {
    console.log("AudioTrack render - waveform length:", waveform.length, "duration:", duration);
    
    if (waveform.length > 0 && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) {
          console.error("Could not get canvas context");
          return;
        }
        
        console.log("Drawing waveform on canvas...");
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
        
        console.log("Waveform drawn successfully");
    } else {
      console.log("Not drawing waveform - waveform length:", waveform.length, "canvas:", !!canvasRef.current);
    }
  }, [waveform]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <AudioWaveform className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">Audio Track</span>
      </div>
      <div className="h-20 bg-secondary/30 border border-border/30 rounded-md relative">
        {waveform.length > 0 ? (
          <>
            <canvas ref={canvasRef} className="w-full h-full rounded-md" width="1200" height="80"></canvas>
            {audioMarkers.map((markerTime, index) => {
              const markerPosition = duration > 0 ? `${(markerTime / duration) * 100}%` : '0%';
              return (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 cursor-ew-resize group"
                  style={{ left: markerPosition }}
                  onMouseDown={() => setDraggingMarkerIndex(index)}
                >
                  <div className="absolute -top-1 -translate-x-1/2 bg-yellow-400 p-0.5 rounded-full ring-1 ring-background group-hover:scale-110 transition-transform">
                    <MapPin className="h-2 w-2 text-background" fill="currentColor"/>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center p-4">
              <p className="text-muted-foreground text-sm">Upload audio to generate waveform</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTrack;
