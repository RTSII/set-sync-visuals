import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Search } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

type MediaClip = {
  id: string;
  src: string;
  file: File;
};

const MediaLibrary = () => {
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Media Library</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clips..." className="pl-10" />
        </div>
        <Tabs defaultValue="project" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>
          <TabsContent value="project" className="flex-1 mt-4 overflow-y-auto">
             {mediaClips.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                    {mediaClips.map((clip, index) => (
                        <div 
                            key={clip.id} 
                            className="aspect-video rounded-md overflow-hidden cursor-grab ring-offset-background ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 relative group active:cursor-grabbing"
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <video src={clip.src} className="w-full h-full object-cover pointer-events-none" muted loop autoPlay playsInline/>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed border-border rounded-lg p-4">
                    <UploadCloud className="h-8 w-8 mb-2"/>
                    <p className="text-sm font-semibold">Upload your video clips</p>
                    <p className="text-xs">Drag and drop clips to reorder them</p>
                </div>
             )}
          </TabsContent>
          <TabsContent value="stock" className="flex-1 text-center mt-4">
            <p className="text-muted-foreground text-sm">Stock video library coming soon!</p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" multiple />
        <Button className="w-full" onClick={handleUploadClick}>
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Video
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MediaLibrary;
