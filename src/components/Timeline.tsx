
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Plus, Minus, Music, Video } from "lucide-react";

const Timeline = () => {
  return (
    <Card className="flex-1 flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Scissors className="h-4 w-4 mr-2"/>Split</Button>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">00:01:15:03</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Minus className="h-4 w-4" /></Button>
            <div className="w-24 bg-muted h-1 rounded-full"><div className="w-1/2 bg-primary h-1 rounded-full"></div></div>
            <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <CardContent className="p-4 flex-1 overflow-x-auto">
        <div className="relative min-w-[1200px]">
            {/* Timeline Ruler */}
            <div className="h-6 flex items-center text-xs text-muted-foreground mb-2">
                {Array.from({length: 12}).map((_, i) => (
                    <div key={i} className="w-[100px] border-l border-border/50 pl-1">{`0:${i*10}`}</div>
                ))}
            </div>
            
            {/* Playhead */}
            <div className="absolute top-6 bottom-0 w-0.5 bg-primary z-10" style={{left: '25%'}}>
                <div className="h-2 w-2 rounded-full bg-background border-2 border-primary absolute -top-1 -translate-x-1/2"></div>
            </div>

            {/* Tracks */}
            <div className="space-y-2">
                {/* Audio Track */}
                <div className="h-20 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
                        <Music className="h-5 w-5 text-foreground"/>
                    </div>
                    <div 
                        className="flex-1 h-full bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20"
                        style={{
                            maskImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none'/%3e%3cpath d='M0,20 C40,10 60,30 100,20 S140,10 200,20' stroke='black' stroke-width='2' fill='transparent'/%3e%3c/svg%3e")`,
                            maskSize: '200px 50px',
                        }}
                    ></div>
                </div>

                {/* Video Track */}
                <div className="h-20 bg-secondary/30 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-8 h-full flex items-center justify-center bg-muted rounded">
                        <Video className="h-5 w-5 text-foreground"/>
                    </div>
                    <div className="flex-1 h-full relative">
                        <div className="absolute top-0 h-full w-1/4 bg-blue-400/50 rounded-md border border-blue-300" style={{left: '10%'}}></div>
                        <div className="absolute top-0 h-full w-1/3 bg-purple-400/50 rounded-md border border-purple-300" style={{left: '40%'}}></div>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
