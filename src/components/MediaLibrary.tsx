
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, Search } from "lucide-react";

const mediaClips = [
  { id: 1, src: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop" },
  { id: 2, src: "https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=400&auto=format&fit=crop" },
  { id: 3, src: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?q=80&w=400&auto=format&fit=crop" },
  { id: 4, src: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=400&auto=format&fit=crop" },
];

const MediaLibrary = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Media Library</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clips..." className="pl-10" />
        </div>
        <Tabs defaultValue="project" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
          </TabsList>
          <TabsContent value="project" className="flex-1 mt-4">
             <div className="grid grid-cols-2 gap-2">
                {mediaClips.map(clip => (
                    <div key={clip.id} className="aspect-video rounded-md overflow-hidden cursor-pointer ring-offset-background ring-primary focus-visible:ring-2 focus-visible:ring-offset-2">
                        <img src={clip.src} className="w-full h-full object-cover"/>
                    </div>
                ))}
             </div>
          </TabsContent>
          <TabsContent value="stock" className="flex-1 text-center mt-4">
            <p className="text-muted-foreground text-sm">Stock video library coming soon!</p>
          </TabsContent>
        </Tabs>
        <Button className="w-full mt-auto">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload Video
        </Button>
      </CardContent>
    </Card>
  );
};

export default MediaLibrary;
