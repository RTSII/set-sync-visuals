
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Plus, Music, Video } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@/lib/store";
import { MediaClip } from "@/types";

const MediaLibrary = () => {
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const { addClipToTimeline, loadAudio } = useEditorStore();

  const handleUploadVideoClick = () => {
    videoInputRef.current?.click();
  };
  
  const handleUploadAudioClick = () => {
    console.log("Upload audio button clicked");
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
    console.log("Audio file selected:", file?.name, file?.type);
    
    if (!file) {
      console.log("No file selected");
      return;
    }
    
    if (file.type.startsWith('audio/')) {
      console.log("Valid audio file, calling loadAudio...");
      try {
        await loadAudio(file);
        console.log("loadAudio completed successfully");
      } catch (error) {
        console.error("Error in loadAudio:", error);
      }
    } else {
      console.error("Invalid file type:", file.type);
    }
  };

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mediaClips.forEach(clip => URL.revokeObjectURL(clip.src));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Set data for dropping into the timeline
    e.dataTransfer.setData("application/rvj-clip", JSON.stringify(clip));
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Load Media</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2 overflow-hidden p-3 pt-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {mediaClips.length > 0 ? (
            <div className="grid grid-cols-2 gap-1 overflow-y-auto max-h-full">
              {mediaClips.map((clip, index) => (
                <div 
                  key={clip.id} 
                  className="aspect-video rounded-sm overflow-hidden cursor-grab ring-offset-background ring-primary focus-visible:ring-1 focus-visible:ring-offset-1 relative group active:cursor-grabbing bg-muted/50"
                  draggable
                  onDragStart={(e) => handleClipDragStart(e, clip, index)}
                  onDragEnter={() => (dragOverItem.current = index)}
                  onDragEnd={handleDragSort}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {/* Static video icon instead of preview */}
                  <div className="w-full h-full flex items-center justify-center bg-muted/30">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                    {clip.file.name}
                  </div>
                  <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full">
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-white hover:bg-white/20 hover:text-white" onClick={() => addClipToTimeline(clip)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
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
