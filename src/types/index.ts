
export type Transition = {
  type: 'crossfade';
  duration: number; // in seconds
};

export type MediaClip = {
  id: string;
  src: string;
  file: File;
  transition?: Transition | null; // Transition from the PREVIOUS clip to this one
};
