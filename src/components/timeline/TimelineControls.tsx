
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus, Download, Loader2, MapPin } from "lucide-react";
import { useEditorStore } from '@/lib/store';

interface TimelineControlsProps {
  handleExport: () => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({ handleExport }) => {
  const { isExporting, exportProgress, currentTime, addAudioMarker } = useEditorStore();

  return null; // Controls removed - functionality moved to other parts of the app
};

export default TimelineControls;
