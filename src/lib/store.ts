
import { create } from 'zustand';
import { MediaClip, Transition } from '@/types';

interface EditorState {
  timelineClips: MediaClip[];
  setTimelineClips: (clips: MediaClip[] | ((clips: MediaClip[]) => MediaClip[])) => void;
  updateClip: (clipId: string, newProps: Partial<MediaClip>) => void;
  addClipToTimeline: (clip: Omit<MediaClip, 'startTime' | 'endTime' | 'originalDuration' | 'transition'>) => void;

  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;

  currentTime: number;
  setCurrentTime: (time: number) => void;

  duration: number;
  setDuration: (duration: number) => void;

  selectedClip: MediaClip | null;
  setSelectedClip: (clip: MediaClip | null) => void;

  audioSrc: string | null;
  setAudioSrc: (src: string | null) => void;

  audioFile: File | null;
  setAudioFile: (file: File | null) => void;

  audioMarkers: number[];
  setAudioMarkers: (updater: number[] | ((markers: number[]) => number[])) => void;
  addAudioMarker: (time: number) => void;

  waveform: number[];
  setWaveform: (data: number[]) => void;

  wasPlaying: boolean;
  setWasPlaying: (wasPlaying: boolean) => void;

  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;

  exportProgress: number;
  setExportProgress: (progress: number) => void;

  trimmingClipId: string | null;
  setTrimmingClipId: (id: string | null) => void;

  loadAudio: (file: File) => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  timelineClips: [],
  setTimelineClips: (updater) => set(state => ({ timelineClips: typeof updater === 'function' ? updater(state.timelineClips) : updater })),
  updateClip: (clipId, newProps) => set(state => ({
    timelineClips: state.timelineClips.map(clip =>
      clip.id === clipId ? { ...clip, ...newProps } : clip
    ),
    // Update selectedClip if it's the one being updated
    selectedClip: state.selectedClip?.id === clipId ? { ...state.selectedClip, ...newProps } : state.selectedClip
  })), addClipToTimeline: (clip) => {
    if (!get().timelineClips.find(c => c.id === clip.id)) {
      set(state => {
        // Default to 8 seconds initially, will be updated when video metadata loads
        const defaultDuration = 8;
        const newClip: MediaClip = {
          ...clip,
          startTime: 0,
          endTime: defaultDuration,
          originalDuration: defaultDuration,
        };
        const newClips = [...state.timelineClips, newClip];
        console.log(`Added clip to timeline: ${clip.id}, total clips: ${newClips.length}`);
        return { timelineClips: newClips };
      });
    }
  },

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),

  duration: 0,
  setDuration: (duration) => {
    console.log("Setting duration to:", duration);
    set({ duration });
  },

  selectedClip: null,
  setSelectedClip: (clip) => {
    console.log("Setting selected clip:", clip?.id);
    set({ selectedClip: clip, trimmingClipId: null });
  },

  audioSrc: null,
  setAudioSrc: (src) => {
    console.log("Setting audio src:", src ? "URL created" : "null");
    set({ audioSrc: src });
  },

  audioFile: null,
  setAudioFile: (file) => {
    console.log("Setting audio file:", file ? file.name : "null");
    set({ audioFile: file });
  },

  audioMarkers: [],
  setAudioMarkers: (updater) => set(state => ({ audioMarkers: typeof updater === 'function' ? updater(state.audioMarkers) : updater })),
  addAudioMarker: (time: number) => {
    // Avoid duplicate markers at the same spot
    if (!get().audioMarkers.some(m => Math.abs(m - time) < 0.1)) {
      set(state => ({ audioMarkers: [...state.audioMarkers, time].sort((a, b) => a - b) }));
    }
  },

  waveform: [],
  setWaveform: (data) => {
    console.log("Setting waveform data, length:", data.length);
    set({ waveform: data });
  },

  wasPlaying: false,
  setWasPlaying: (wasPlaying) => set({ wasPlaying }),

  isExporting: false,
  setIsExporting: (isExporting: boolean) => set({ isExporting }),

  exportProgress: 0,
  setExportProgress: (progress: number) => set({ exportProgress: progress }),

  trimmingClipId: null,
  setTrimmingClipId: (id) => set({ trimmingClipId: id }),

  loadAudio: async (file: File) => {
    console.log("loadAudio called with file:", file.name, "size:", file.size, "type:", file.type);
    
    try {
      get().setAudioFile(file); // Store the raw file for export
      const objectUrl = URL.createObjectURL(file);
      console.log("Created object URL:", objectUrl);
      get().setAudioSrc(objectUrl);

      // Set duration from audio file
      const audio = new Audio();
      audio.src = objectUrl;
      
      audio.addEventListener('loadedmetadata', () => {
        console.log("Audio metadata loaded, duration:", audio.duration);
        get().setDuration(audio.duration);
      });

      audio.addEventListener('error', (e) => {
        console.error("Audio loading error:", e);
      });

      console.log("Starting audio context processing...");
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("AudioContext created, state:", audioContext.state);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log("ArrayBuffer created, size:", arrayBuffer.byteLength);
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log("AudioBuffer decoded, duration:", audioBuffer.duration, "channels:", audioBuffer.numberOfChannels);

      const channelData = audioBuffer.getChannelData(0);
      console.log("Channel data length:", channelData.length);

      const canvasWidth = 1200; // Corresponds to canvas width attribute
      const samples = Math.floor(channelData.length / canvasWidth);
      console.log("Samples per pixel:", samples);
      
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
      
      console.log("Waveform data generated, length:", waveformData.length, "sample values:", waveformData.slice(0, 10));
      get().setWaveform(waveformData);
      console.log("Audio processing completed successfully");
    } catch (e) {
      console.error("Error processing audio file:", e);
    }
  },
}));
