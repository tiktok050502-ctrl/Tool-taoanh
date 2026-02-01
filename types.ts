
export enum AppMode {
  JEWELRY = 'JEWELRY',
  FASHION = 'FASHION'
}

export enum AppView {
  TRY_ON = 'TRY_ON',
  PROMPT_GEN = 'PROMPT_GEN'
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  STANDARD = '3:4',
  WIDE = '4:3'
}

export enum ImageResolution {
  SD = 'SD (Tiêu chuẩn)',
  HD = 'HD (Sắc nét)',
  UHD = '2K/4K (Siêu nét)'
}

export enum JewelryPosition {
  NECK = 'đeo cổ',
  WRIST = 'đeo tay',
  HAND = 'cầm tay',
  EAR = 'đeo tai'
}

export interface GenerationConfig {
  mode: AppMode;
  aspectRatio: AspectRatio;
  jewelryPosition?: JewelryPosition;
  resolution: ImageResolution;
}

export interface VideoPrompt {
  frame: number;
  action: string;
  camera_movement: string;
  prompt_text: string;
}

export interface GeneratedImage {
  url: string;
  timestamp: number;
}
