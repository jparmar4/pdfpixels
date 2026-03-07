export type RGBAImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type Mask = Uint8Array; // 0|1 per pixel

export type SoftMask = Uint8Array; // 0..255 per pixel

export type BlurRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SegmentationResult = {
  image: RGBAImage;
  bgMask: Mask;
  fgMask: Mask;
  softFgMask: SoftMask;
  bgRatio: number;
  engine: string;
};

export type FaceDetectionResult = {
  regions: BlurRegion[];
  engine: string;
};
