import { create } from 'zustand';
import { TimelineClip } from '@/types';
import { generateId } from './utils';

interface EditorState {
  clips: TimelineClip[];
  selectedClipId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  waveformData: any[];
  audioUrl: string | null;
  zoomLevel: number;
}

interface EditorActions {
  addClip: (clip: Omit<TimelineClip, 'id'>) => void;
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  removeClip: (id: string) => void;
  setSelectedClipId: (id: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setWaveformData: (waveformData: any[]) => void;
  setAudioUrl: (audioUrl: string | null) => void;
  setZoomLevel: (zoomLevel: number) => void;
  
  loadProject: (clips: TimelineClip[]) => void;
  clearTimeline: () => void;
}

interface EditorStore extends EditorState, EditorActions {}

export const useEditorStore = create<EditorStore>((set, get) => ({
  clips: [],
  selectedClipId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  waveformData: [],
  audioUrl: null,
  zoomLevel: 100,

  addClip: (clip) => {
    const newClip: TimelineClip = {
      ...clip,
      id: generateId(),
    };
    set((state) => ({
      clips: [...state.clips, newClip],
    }));
  },
  updateClip: (id, updates) => {
    set((state) => ({
      clips: state.clips.map((clip) => (clip.id === id ? { ...clip, ...updates } : clip)),
    }));
  },
  removeClip: (id) => {
    set((state) => ({
      clips: state.clips.filter((clip) => clip.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }));
  },
  setSelectedClipId: (id) => set({ selectedClipId: id }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setWaveformData: (waveformData) => set({ waveformData }),
  setAudioUrl: (audioUrl) => set({ audioUrl }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  
  loadProject: (clips: TimelineClip[]) => set({
    clips,
    selectedClipId: null,
    currentTime: 0,
  }),
  
  clearTimeline: () => set({
    clips: [],
    selectedClipId: null,
    currentTime: 0,
    isPlaying: false,
    audioUrl: null,
    duration: 0,
    waveformData: [],
  }),
}));
