
import { useEffect } from 'react';
import { useEditorStore } from '@/lib/store';
import { useEditor } from '@/context/EditorContext';

export const useKeyboardShortcuts = () => {
  const { selectedClip, isPlaying, removeClip } = useEditorStore();
  const { togglePlay, videoRef } = useEditor();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (selectedClip) {
            togglePlay();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (videoRef.current && selectedClip) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (videoRef.current && selectedClip) {
            videoRef.current.currentTime = Math.min(
              selectedClip.endTime ?? videoRef.current.duration,
              videoRef.current.currentTime + 5
            );
          }
          break;
        case 'KeyJ':
          event.preventDefault();
          if (videoRef.current && selectedClip) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          }
          break;
        case 'KeyL':
          event.preventDefault();
          if (videoRef.current && selectedClip) {
            videoRef.current.currentTime = Math.min(
              selectedClip.endTime ?? videoRef.current.duration,
              videoRef.current.currentTime + 10
            );
          }
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          if (selectedClip) {
            removeClip(selectedClip.id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedClip, isPlaying, togglePlay, videoRef, removeClip]);
};
