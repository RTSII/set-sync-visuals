import { create } from 'zustand';
import { MediaClip } from '@/types';

interface EditorState {
  timelineClips: MediaClip[];
  setTimelineClips: (clips: MediaClip[] | ((clips: MediaClip[]) => MediaClip[])) => void;
  addClipToTimeline: (clip: MediaClip) => void;
  
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

  waveform: number[];
  setWaveform: (data: number[]) => void;
  
  wasPlaying: boolean;
  setWasPlaying: (wasPlaying: boolean) => void;
  
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;

  exportProgress: number;
  setExportProgress: (progress: number) => void;
  
  loadAudio: (file: File) => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  timelineClips: [],
  setTimelineClips: (updater) => set(state => ({ timelineClips: typeof updater === 'function' ? updater(state.timelineClips) : updater })),
  addClipToTimeline: (clip) => {
    if (!get().timelineClips.find(c => c.id === clip.id)) {
      set(state => {
        const newClips = [...state.timelineClips, clip];
        // If this is the first clip, select it automatically
        if (newClips.length === 1) {
          return { timelineClips: newClips, selectedClip: clip };
        }
        return { timelineClips: newClips };
      });
    }
  },

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),

  duration: 0,
  setDuration: (duration) => set({ duration }),

  selectedClip: null,
  setSelectedClip: (clip) => set({ selectedClip: clip }),

  audioSrc: null,
  setAudioSrc: (src) => set({ audioSrc: src }),

  audioFile: null,
  setAudioFile: (file) => set({ audioFile: file }),

  waveform: [],
  setWaveform: (data) => set({ waveform: data }),
  
  wasPlaying: false,
  setWasPlaying: (wasPlaying) => set({ wasPlaying }),

  isExporting: false,
  setIsExporting: (isExporting: boolean) => set({ isExporting }),

  exportProgress: 0,
  setExportProgress: (progress: number) => set({ exportProgress: progress }),
  
  loadAudio: async (file: File) => {
    get().setAudioFile(file); // Store the raw file for export
    const objectUrl = URL.createObjectURL(file);
    get().setAudioSrc(objectUrl);

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
      get().setWaveform(waveformData);
    } catch(e) {
      console.error("Error processing audio file:", e);
    }
  },
}));
