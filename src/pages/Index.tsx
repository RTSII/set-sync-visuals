
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
    <div className="h-screen bg-background font-sans text-foreground flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col p-4 pt-28">
        <EditorProvider>
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 rounded-lg border border-border/50"
          >
            <ResizablePanel defaultSize={70} minSize={50}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="p-1 h-full">
                    <VideoPreview />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
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
