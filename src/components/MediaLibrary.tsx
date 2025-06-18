
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSwap } from "@/components/ui/card-swap";
import { UploadCloud, Plus, Music, Video } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { MediaClip } from "@/types";

const MediaLibrary = () => {
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>({});
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { addClipToTimeline, loadAudio, setSelectedClip } = useEditorStore();

  const generateThumbnail = (clip: MediaClip): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = "anonymous";
      video.src = clip.src;
      video.muted = true;
      video.preload = "metadata";

      const timeout = setTimeout(() => {
        resolve("data:,"); // Empty placeholder
      }, 5000);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(0.5, video.duration / 3);
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(thumbnailUrl);
        } else {
          resolve("data:,");
        }
        video.remove();
      };

      video.onerror = () => {
        clearTimeout(timeout);
        resolve("data:,");
      };
    });
  };

  useEffect(() => {
    mediaClips.forEach(async (clip) => {
      if (!thumbnailCache[clip.id]) {
        const thumbnail = await generateThumbnail(clip);
        setThumbnailCache(prev => ({ ...prev, [clip.id]: thumbnail }));
      }
    });
  }, [mediaClips, thumbnailCache]);

  const handleUploadVideoClick = () => {
    videoInputRef.current?.click();
  };
  
  const handleUploadAudioClick = () => {
    audioInputRef.current?.click();
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newClips: MediaClip[] = Array.from(files)
      .filter(file => file.type.startsWith('video/'))
      .map(file => ({
        id: crypto.randomUUID(),
        src: URL.createObjectURL(file),
        file: file,
      }));
    
    setMediaClips(prevClips => [...prevClips, ...newClips]);
  };
  
  const handleAudioFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (file.type.startsWith('audio/')) {
      try {
        await loadAudio(file);
      } catch (error) {
        console.error("Error in loadAudio:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      mediaClips.forEach(clip => URL.revokeObjectURL(clip.src));
    };
  }, []);

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;

    setMediaClips(prevClips => {
        const newClips = [...prevClips];
        const draggedItemContent = newClips.splice(dragItem.current!, 1)[0];
        if (draggedItemContent) {
            newClips.splice(dragOverItem.current!, 0, draggedItemContent);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        return newClips;
    });
  };

  const handleClipDragStart = (e: React.DragEvent<HTMLDivElement>, clip: MediaClip, index: number) => {
    dragItem.current = index;
    e.dataTransfer.setData("application/rvj-clip", JSON.stringify(clip));
  };

  const cardSwapData = mediaClips.map(clip => ({
    id: clip.id,
    thumbnail: thumbnailCache[clip.id] || "data:,",
    title: clip.file.name,
    onClick: () => {
      addClipToTimeline(clip);
      setSelectedClip(clip);
    }
  }));

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Load Media</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden p-3 pt-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {mediaClips.length > 0 ? (
            <div className="h-full">
              <CardSwap cards={cardSwapData} className="h-full" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border border-dashed border-border rounded-lg p-2">
              <UploadCloud className="h-6 w-6 mb-1"/>
              <p className="text-xs font-medium">Upload your media</p>
              <p className="text-xs opacity-75">Drag and drop to reorder</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-1 p-3 pt-1">
        <input type="file" ref={videoInputRef} onChange={handleVideoFileChange} accept="video/*" className="hidden" multiple />
        <input type="file" ref={audioInputRef} onChange={handleAudioFileChange} accept="audio/*" className="hidden" />
        <Button className="w-full h-7 text-xs" onClick={handleUploadVideoClick}>
          <UploadCloud className="mr-1 h-3 w-3" /> Upload Video
        </Button>
        <Button className="w-full h-7 text-xs" variant="secondary" onClick={handleUploadAudioClick}>
          <Music className="mr-1 h-3 w-3" /> Upload Audio
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MediaLibrary;
