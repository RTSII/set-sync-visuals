
import Header from "@/components/Header";
import MediaLibrary from "@/components/MediaLibrary";
import Timeline from "@/components/Timeline";
import VideoPreview from "@/components/VideoPreview";
import { EditorProvider } from "@/context/EditorContext";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

const Index = () => {
  return (
    <div className="h-screen bg-background font-sans text-foreground flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col pt-16 px-2 pb-2 min-h-0">
        <EditorProvider>
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 rounded-lg border border-border/50 min-h-0"
          >
            <ResizablePanel defaultSize={70} minSize={50}>
              <ResizablePanelGroup direction="vertical" className="min-h-0">
                <ResizablePanel defaultSize={65} minSize={50}>
                  <div className="p-1 h-full">
                    <VideoPreview />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35} minSize={25}>
                  <div className="p-1 h-full">
                    <Timeline />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <MediaLibrary />
            </ResizablePanel>
          </ResizablePanelGroup>
        </EditorProvider>
      </main>
    </div>
  );
};

export default Index;
