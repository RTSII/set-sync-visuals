
import Header from "@/components/Header";
import MediaLibrary from "@/components/MediaLibrary";
import Timeline from "@/components/Timeline";
import VideoPreview from "@/components/VideoPreview";
import { EditorProvider } from "@/context/EditorContext";

const Index = () => {
  return (
    <div className="h-screen bg-background font-sans text-foreground">
      <Header />
      <main className="absolute top-24 left-0 right-0 bottom-0 flex gap-4 p-4">
        <EditorProvider>
          <div className="flex-[2] flex flex-col gap-4 min-h-0">
            <div className="flex-[2] min-h-0">
              <VideoPreview />
            </div>
            <div className="flex-[3] min-h-0">
              <Timeline />
            </div>
          </div>
          <div className="flex-[1] flex flex-col min-h-0">
            <MediaLibrary />
          </div>
        </EditorProvider>
      </main>
    </div>
  );
};

export default Index;
