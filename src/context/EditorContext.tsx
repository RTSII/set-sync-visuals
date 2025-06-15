import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';

// This type will be shared between components
export type MediaClip = {
  id: string;
  src: string;
  file: File;
};

interface EditorContextType {
  timelineClips: MediaClip[];
  addClipToTimeline: (clip: MediaClip) => void;
  setTimelineClips: React.Dispatch<React.SetStateAction<MediaClip[]>>;
  
  // Playback State
  isPlaying: boolean;
  togglePlay: () => void;
  handleClipEnded: () => void;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  duration: number;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  selectedClip: MediaClip | null;
  setSelectedClip: React.Dispatch<React.SetStateAction<MediaClip | null>>;
  
  // Media Element Refs and Sources
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioSrc: string | null;
  setAudioSrc: React.Dispatch<React.SetStateAction<string | null>>;
  loadAudio: (file: File) => Promise<void>;
  
  // Waveform
  waveform: number[];
  
  // Autoplay signal
  wasPlaying: boolean;
  setWasPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [timelineClips, setTimelineClips] = useState<MediaClip[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedClip, setSelectedClip] = useState<MediaClip | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [wasPlaying, setWasPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    // Sync audio current time with video current time
    const video = videoRef.current;
    const audio = audioRef.current;
    if (video && audio && isPlaying && Math.abs(video.currentTime - audio.currentTime) > 0.2) {
      audio.currentTime = video.currentTime;
    }
  }, [currentTime, isPlaying]);


  const loadAudio = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setAudioSrc(objectUrl);

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
    }
  };

  const togglePlay = () => {
    if (!selectedClip || !videoRef.current) return;
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video.paused) {
      video.play().catch(e => console.error("Video play error:", e));
      audio?.play().catch(e => console.error("Audio play error:", e));
    } else {
      video.pause();
      audio?.pause();
    }
  };

  const handleClipEnded = () => {
    if (!selectedClip) return;
    
    const currentIndex = timelineClips.findIndex(c => c.id === selectedClip.id);
    const isLastClip = currentIndex === timelineClips.length - 1;

    if (currentIndex > -1 && !isLastClip) {
        const nextClip = timelineClips[currentIndex + 1];
        if (nextClip) {
          setWasPlaying(true);
          setSelectedClip(nextClip);
        }
    }
  };

  const addClipToTimeline = (clip: MediaClip) => {
    // Avoid adding duplicate clips to the timeline
    if (!timelineClips.find(c => c.id === clip.id)) {
      setTimelineClips(prevClips => {
        const newClips = [...prevClips, clip];
        // If this is the first clip, select it automatically
        if (newClips.length === 1) {
          setSelectedClip(clip);
        }
        return newClips;
      });
    }
  };

  const value = {
    timelineClips,
    addClipToTimeline,
    setTimelineClips,
    isPlaying,
    togglePlay,
    handleClipEnded,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    selectedClip,
    setSelectedClip,
    videoRef,
    audioRef,
    audioSrc,
    setAudioSrc,
    loadAudio,
    waveform,
    wasPlaying,
    setWasPlaying,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
