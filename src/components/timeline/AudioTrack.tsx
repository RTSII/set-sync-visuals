
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

  return (
    <div className="h-20 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
      <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
          <AudioWaveform className="h-4 w-4 text-foreground"/>
      </div>
      <div className="flex-1 h-full relative bg-muted/30 rounded">
        {waveform.length > 0 ? (
          <>
            <canvas ref={canvasRef} className="w-full h-full" width="1200" height="64"></canvas>
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
                    <MapPin className="h-2.5 w-2.5 text-background" fill="currentColor"/>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-center p-2">
              <p className="text-muted-foreground text-xs">Upload an audio file from the media library to generate its waveform.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTrack;
