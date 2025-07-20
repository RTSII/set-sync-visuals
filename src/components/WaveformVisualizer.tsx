import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ audioBuffer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const numPoints = Math.min(5000, audioBuffer.length); // Downsample for efficiency (e.g., 2hr audio)

    // Helper to get downsampled data from buffer (mono channel 0)
    const getDownsampledData = (buffer: AudioBuffer) => {
      const data = buffer.getChannelData(0);
      const step = Math.ceil(data.length / numPoints);
      const downsampled = new Float32Array(numPoints);
      for (let i = 0; i < numPoints; i++) {
        downsampled[i] = data[i * step];
      }
      return downsampled;
    };

    // Filter buffer for frequency bands using OfflineAudioContext
    const filterBuffer = async (lowFreq: number, highFreq: number) => {
      const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      const biquad = offlineCtx.createBiquadFilter();
      biquad.type = 'bandpass';
      biquad.frequency.value = (lowFreq + highFreq) / 2;
      biquad.Q.value = 1 / ((highFreq - lowFreq) / biquad.frequency.value); // Bandwidth
      source.connect(biquad);
      biquad.connect(offlineCtx.destination);
      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      return getDownsampledData(renderedBuffer);
    };

    const drawWaveform = async () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Overall vertical gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)'); // Dark at bottom
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)'); // Light at top
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Get filtered data
      const bassData = await filterBuffer(20, 250); // Bass
      const midsData = await filterBuffer(250, 4000); // Mids
      const highsData = await filterBuffer(4000, 22050); // Highs (up to Nyquist)

      // Draw function with color, thickness, and scale
      const drawLine = (data: Float32Array, colorStart: string, colorEnd: string, lineWidth: number, ampScale: number) => {
        const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
        lineGradient.addColorStop(0, colorStart);
        lineGradient.addColorStop(1, colorEnd);
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const sliceWidth = width / numPoints;
        let x = 0;
        for (let i = 0; i < numPoints; i++) {
          const y = (height / 2) + (data[i] * (height / 2) * ampScale); // Vertical thickness via amp scale
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth; // Horizontal "thickness" via line width
        }
        ctx.stroke();
      };

      // Draw layers: Bass (thick, high amp), Mids (medium), Highs (thin, low amp)
      drawLine(bassData, '#FF4500', '#FFD700', 4, 1.5); // Red-orange, thick, emphasized amp for bass
      drawLine(midsData, '#32CD32', '#90EE90', 2, 1.0); // Green, medium
      drawLine(highsData, '#1E90FF', '#87CEEB', 1, 0.7); // Blue, thin, reduced amp
    };

    drawWaveform();
  }, [audioBuffer]);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Waveform Visualizer</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} width={800} height={300} className="w-full" />
        <p className="mt-2 text-sm">Bass (red-orange, thick), Mids (green, medium), Highs (blue, thin) with overall gradient.</p>
      </CardContent>
    </Card>
  );
};

export default WaveformVisualizer;
