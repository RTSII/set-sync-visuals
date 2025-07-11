import { useEffect, useRef } from 'react';
import { MediaClip } from '@/types';

export const useVideoPreloader = (clips: MediaClip[], currentClipId: string | undefined) => {
  const preloadedVideos = useRef<Map<string, HTMLVideoElement>>(new Map());
  const isPreloading = useRef<boolean>(false);

  useEffect(() => {
    // Prevent concurrent preloading to avoid bandwidth competition
    if (isPreloading.current) return;
    
    // Find current clip index
    const currentIndex = clips.findIndex(clip => clip.id === currentClipId);
    if (currentIndex === -1) return;
    
    // Only preload the next clip to reduce bandwidth usage
    const nextClipIndex = currentIndex + 1;
    const nextClip = clips[nextClipIndex];
    
    // Clean up old preloaded videos (keep only current and next)
    preloadedVideos.current.forEach((video, clipId) => {
      const clipIndex = clips.findIndex(clip => clip.id === clipId);
      if (clipIndex !== currentIndex && clipIndex !== nextClipIndex) {
        video.pause();
        video.src = '';
        video.load();
        preloadedVideos.current.delete(clipId);
        console.log("🎬 PRELOAD: Cleaned up video for clip:", clipId);
      }
    });

    // Preload only the next clip if it exists and isn't already preloaded
    if (nextClip && !preloadedVideos.current.has(nextClip.id)) {
      // Wait a bit before starting preload to not interfere with current video
      setTimeout(() => {
        if (isPreloading.current) return;
        
        isPreloading.current = true;
        
        const video = document.createElement('video');
        video.src = nextClip.src;
        video.preload = 'auto'; // More aggressive for next clip only
        video.muted = true;
        
        const handleCanPlay = () => {
          console.log("🎬 PRELOAD: Video ready for clip:", nextClip.id);
          video.removeEventListener('canplay', handleCanPlay);
          isPreloading.current = false;
        };
        
        const handleError = () => {
          console.error("🎬 PRELOAD: Error preloading clip:", nextClip.id);
          video.removeEventListener('error', handleError);
          preloadedVideos.current.delete(nextClip.id);
          isPreloading.current = false;
        };
        
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        video.load();
        
        preloadedVideos.current.set(nextClip.id, video);
        console.log("🎬 PRELOAD: Started preloading next clip:", nextClip.id);
      }, 2000); // Wait 2 seconds before starting preload
    }
  }, [clips, currentClipId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach(video => {
        video.src = '';
        video.load();
      });
      preloadedVideos.current.clear();
    };
  }, []);

  return {
    isPreloaded: (clipId: string) => preloadedVideos.current.has(clipId),
    getPreloadedVideo: (clipId: string) => preloadedVideos.current.get(clipId)
  };
};