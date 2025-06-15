
import { Button } from "@/components/ui/button";
import { Play, Pause, Rewind, FastForward, Expand } from "lucide-react";

const VideoPreview = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="aspect-video bg-black flex items-center justify-center relative group">
        <img
          src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=2000&auto=format&fit=crop"
          alt="Video preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <Button size="icon" className="w-16 h-16 rounded-full bg-primary/80 hover:bg-primary animate-glow">
            <Play className="h-8 w-8" fill="white" />
           </Button>
        </div>
      </div>
      <div className="p-2 bg-secondary/20 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Rewind className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><Play className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon"><FastForward className="h-5 w-5" /></Button>
        </div>
        <div className="flex-1 mx-4">
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-1/3"></div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">1:15 / 4:30</span>
            <Button variant="ghost" size="icon"><Expand className="h-5 w-5" /></Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
