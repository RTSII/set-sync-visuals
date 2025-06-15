
import React from 'react';

const TimelineRuler: React.FC = () => {
  return (
    <div className="h-6 flex items-center text-xs text-muted-foreground mb-2">
      {Array.from({length: 8}).map((_, i) => (
          <div key={i} className="w-[100px] border-l border-border/50 pl-1">{`0:${i*10}`}</div>
      ))}
    </div>
  );
};

export default TimelineRuler;
