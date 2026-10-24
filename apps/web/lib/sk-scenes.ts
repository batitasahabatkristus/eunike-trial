import { assetUrl, type LessonBundle } from "@/lib/sk";
export const sceneSources = (l: LessonBundle): Record<number, string> => Object.fromEntries(l.scenes.map((s) => [s.position, assetUrl(s.image_path)]));
