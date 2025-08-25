import { toAbsolute } from '../AudioProvider/helpers';
import type { PreloadParams } from '../crossfade-types';

export function preloadStandbyNext(opts: PreloadParams) {
  const { queue, index, nextIndex, standbyAudio } = opts;
  if (!standbyAudio) return;
  if (nextIndex === index) return;
  const t = queue[nextIndex];
  if (!t?.fileUrl) return;
  const url = toAbsolute(t.fileUrl);
  if (standbyAudio.src !== url) {
    standbyAudio.src = url;
    try { standbyAudio.load(); } catch {}
  }
}
