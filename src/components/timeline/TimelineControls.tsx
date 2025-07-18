
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus, Download, Loader2, MapPin } from "lucide-react";
import { useEditorStore } from '@/lib/store';

interface TimelineControlsProps {
  handleExport: () => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({ handleExport }) => {
  const { isExporting, exportProgress, currentTime, addAudioMarker } = useEditorStore();

  return (
    <div className="p-1.5 border-b border-border flex items-center justify-center">
      <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-mono">Timeline View</span>
      </div>
    </div>
  );
};

export default TimelineControls;
