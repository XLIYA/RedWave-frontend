// ساخت گراف WebAudio برای دو <audio> (A/B) + master gain + analyser
import { clamp01 } from './helpers';

export type GraphRefs = {
  acRef: React.MutableRefObject<AudioContext | null>;
  masterGainRef: React.MutableRefObject<GainNode | null>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  aRef: React.MutableRefObject<HTMLAudioElement | null>;
  bRef: React.MutableRefObject<HTMLAudioElement | null>;
  srcARef: React.MutableRefObject<MediaElementAudioSourceNode | null>;
  srcBRef: React.MutableRefObject<MediaElementAudioSourceNode | null>;
  gainARef: React.MutableRefObject<GainNode | null>;
  gainBRef: React.MutableRefObject<GainNode | null>;
};

export function ensureAudioGraph(
  refs: GraphRefs,
  initial: { volume: number; muted: boolean }
) {
  // AudioContext
  if (!refs.acRef.current) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    refs.acRef.current = new AC();
  }
  const ac = refs.acRef.current!;

  // masterGain
  if (!refs.masterGainRef.current) {
    refs.masterGainRef.current = ac.createGain();
    refs.masterGainRef.current.gain.value = initial.muted ? 0 : clamp01(initial.volume);
  }

  // analyser
  if (!refs.analyserRef.current) {
    refs.analyserRef.current = ac.createAnalyser();
    refs.analyserRef.current.fftSize = 256;
    refs.analyserRef.current.smoothingTimeConstant = 0.8;
  }

  // اتصال master→analyser→destination
  refs.masterGainRef.current.disconnect?.();
  refs.masterGainRef.current.connect(refs.analyserRef.current);
  refs.analyserRef.current.connect(ac.destination);

  // کانال A
  if (!refs.aRef.current) {
    refs.aRef.current = new Audio();
    refs.aRef.current.preload = 'metadata';
    refs.aRef.current.crossOrigin = 'anonymous';
  }
  if (!refs.srcARef.current) {
    refs.srcARef.current = ac.createMediaElementSource(refs.aRef.current);
  }
  if (!refs.gainARef.current) {
    refs.gainARef.current = ac.createGain();
    refs.gainARef.current.gain.value = 1;
    refs.srcARef.current
      .connect(refs.gainARef.current)
      .connect(refs.masterGainRef.current);
  }

  // کانال B
  if (!refs.bRef.current) {
    refs.bRef.current = new Audio();
    refs.bRef.current.preload = 'metadata';
    refs.bRef.current.crossOrigin = 'anonymous';
  }
  if (!refs.srcBRef.current) {
    refs.srcBRef.current = ac.createMediaElementSource(refs.bRef.current);
  }
  if (!refs.gainBRef.current) {
    refs.gainBRef.current = ac.createGain();
    refs.gainBRef.current.gain.value = 0;
    refs.srcBRef.current
      .connect(refs.gainBRef.current)
      .connect(refs.masterGainRef.current);
  }

  return ac;
}
