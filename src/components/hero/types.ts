export type HeroStage = {
  order: number;
  id: string;
  label: string;
  from: number;
  to: number;
  fromTime: number;
  toTime: number;
};

export type HeroManifest = {
  version: number;
  source: { width: number; height: number; fps: number; totalFrames: number; duration: number };
  output: {
    count: number;
    stride: number;
    effectiveFps: number;
    format: string;
    sets: { id: "hi" | "lo"; width: number; path: string }[];
    files: string[];
  };
  stages: HeroStage[];
};
