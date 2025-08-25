export const EPS = 0.005; // ~5ms lookahead

export function clearAutomation(param: AudioParam, ac: AudioContext, at?: number) {
  const t = at ?? ac.currentTime;
  const anyParam = param as any;
  if (typeof anyParam.cancelAndHoldAtTime === 'function') {
    try { anyParam.cancelAndHoldAtTime(t); return; } catch {}
  }
  param.cancelScheduledValues(0);
}

export function pinValue(param: AudioParam, ac: AudioContext, value: number, at?: number) {
  const t = (at ?? ac.currentTime) + EPS;
  clearAutomation(param, ac, t);
  param.setValueAtTime(value, t);
}
