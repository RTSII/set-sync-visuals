
import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { AudioWaveform, MapPin } from 'lucide-react';
import { FrequencyWaveformData } from '@/lib/audioAnalysis';

interface AudioTrackProps {
  duration: number;
  setDraggingMarkerIndex: (index: number | null) => void;
}

const AudioTrack: React.FC<AudioTrackProps> = ({ duration, setDraggingMarkerIndex }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { waveform, audioMarkers, frequencyWaveformData, isAnalyzingAudio, audioAnalysisProgress } = useEditorStore();

  const drawFrequencyWaveform = (canvas: HTMLCanvasElement, data: FrequencyWaveformData) => {
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);

    const barWidth = width / data.combined.length;
    const maxBarHeight = height * 0.8;

    // Draw layered frequency bands with different colors and intensities
    data.combined.forEach((combinedVal, i) => {
      const bassVal = data.bass[i] || 0;
      const midsVal = data.mids[i] || 0;
      const highsVal = data.highs[i] || 0;
      
      const x = i * barWidth;
      const centerY = height / 2;
      
      // Calculate heights for each frequency band
      const bassHeight = bassVal * maxBarHeight;
      const midsHeight = midsVal * maxBarHeight * 0.7; // Slightly shorter
      const highsHeight = highsVal * maxBarHeight * 0.5; // Even shorter
      
      // Draw bass (darkest and thickest) - darker primary color
      if (bassHeight > 0) {
        context.fillStyle = 'hsl(var(--primary) / 0.9)';
        context.fillRect(x, centerY - bassHeight/2, barWidth * 0.95, bassHeight);
      }
      
      // Draw mids (medium intensity) - medium primary color
      if (midsHeight > 0) {
        context.fillStyle = 'hsl(var(--primary) / 0.6)';
        context.fillRect(x + barWidth * 0.1, centerY - midsHeight/2, barWidth * 0.8, midsHeight);
      }
      
      // Draw highs (lightest) - light primary color
      if (highsHeight > 0) {
        context.fillStyle = 'hsl(var(--primary) / 0.3)';
        context.fillRect(x + barWidth * 0.2, centerY - highsHeight/2, barWidth * 0.6, highsHeight);
      }
    });
  };

  useEffect(() => {
    console.log("AudioTrack render - frequency data:", !!frequencyWaveformData, "duration:", duration);
    
    if (canvasRef.current) {
      if (frequencyWaveformData && frequencyWaveformData.combined.length > 0) {
        console.log("Drawing frequency-separated waveform...");
        drawFrequencyWaveform(canvasRef.current, frequencyWaveformData);
      } else if (waveform.length > 0) {
        // Fallback to simple waveform if frequency data not available
        console.log("Drawing simple waveform...");
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        const width = canvas.width;
        const height = canvas.height;
        context.clearRect(0, 0, width, height);
        
        context.fillStyle = 'hsl(var(--primary))';
        const barWidth = width / waveform.length;
        
        waveform.forEach((val, i) => {
          const barHeight = val * height * 1.5;
          const y = (height - barHeight) / 2;
          context.fillRect(i * barWidth, y, barWidth * 0.9, barHeight);
        });
      }
    }
  }, [waveform, frequencyWaveformData]);

  return (
    <div className="h-12 bg-secondary/30 rounded-md p-1 flex items-center gap-1">
      <div className="w-6 h-full flex items-center justify-center bg-muted rounded flex-shrink-0">
          <AudioWaveform className="h-3 w-3 text-foreground"/>
      </div>
      <div className="flex-1 h-full relative bg-muted/30 rounded">
        {waveform.length > 0 ? (
          <>
            <canvas ref={canvasRef} className="w-full h-full" width="1200" height="40"></canvas>
            {isAnalyzingAudio && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${audioAnalysisProgress * 100}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground">Analyzing audio... {Math.round(audioAnalysisProgress * 100)}%</span>
                </div>
              </div>
            )}
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
          <div className="w-full h-full flex items-center justify-center text-center p-1">
              <p className="text-muted-foreground text-xs">Upload audio to generate waveform</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTrack;
