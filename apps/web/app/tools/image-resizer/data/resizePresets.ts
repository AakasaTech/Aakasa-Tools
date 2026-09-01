export interface ResizePreset {
  label: string;
  width: number;
  height: number;
}

export const RESIZE_PRESETS: ResizePreset[] = [
  { label: 'Instagram post', width: 1080, height: 1080 },
  { label: 'Instagram story', width: 1080, height: 1920 },
  { label: 'Twitter/X post image', width: 1600, height: 900 },
  { label: 'Facebook cover', width: 820, height: 312 },
  { label: 'LinkedIn banner', width: 1584, height: 396 },
  { label: 'YouTube thumbnail', width: 1280, height: 720 },
  { label: 'Desktop wallpaper (FHD)', width: 1920, height: 1080 },
];
