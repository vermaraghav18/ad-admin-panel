// src/types/video.ts
export type VideoItem = {
  cloudinaryUrl: string;
  sourceName?: string;
  posterUrl?: string;
  title?: string;
  enabled?: boolean;
};

export type VideoSection = {
  _id?: string;
  name: string;
  targetType: 'global'|'category'|'state'|'city';
  targetValue?: string;
  afterNth: number;
  repeatEvery: number;   // 0 = no repeat
  repeatCount: number;
  placement: 'horizontal';
  sortIndex: number;
  enabled: boolean;
  videos: VideoItem[];
};
