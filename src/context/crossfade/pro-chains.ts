import type { EQBand } from '../crossfade-types';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export class AdvancedEQChain {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private bands: BiquadFilterNode[] = [];
  private analyzer: AnalyserNode;

  constructor(context: AudioContext, bands: EQBand[]) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();
    this.analyzer = context.createAnalyser();
    this.buildChain(bands);
  }

  private buildChain(eqBands: EQBand[]) {
    this.bands.forEach(band => band.disconnect());
    this.bands = [];
    let currentNode: AudioNode = this.input;

    eqBands.forEach((bandConfig) => {
      if (!bandConfig.enabled) return;
      const filter = this.context.createBiquadFilter();
      filter.type = bandConfig.type;
      filter.frequency.value = bandConfig.frequency;
      filter.Q.value = bandConfig.Q;
      filter.gain.value = bandConfig.gain;

      currentNode.connect(filter);
      currentNode = filter;
      this.bands.push(filter);
    });

    currentNode.connect(this.analyzer);
    this.analyzer.connect(this.output);
  }

  getInput(): AudioNode { return this.input; }
  getOutput(): AudioNode { return this.output; }
  getAnalyzer(): AnalyserNode { return this.analyzer; }

  updateBand(index: number, params: Partial<EQBand>) {
    if (this.bands[index]) {
      const filter = this.bands[index];
      if (params.frequency !== undefined) filter.frequency.value = params.frequency;
      if (params.gain !== undefined) filter.gain.value = params.gain;
      if (params.Q !== undefined) filter.Q.value = params.Q;
    }
  }
}

export class MultibandCompressor {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private bands: { filter: BiquadFilterNode; compressor: DynamicsCompressorNode; gain: GainNode; }[] = [];

  constructor(context: AudioContext) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();
    this.createBands();
  }

  private createBands() {
    const bandConfigs = [
      { freq: 200, type: 'lowpass' as BiquadFilterType, threshold: -20, ratio: 4, attack: 0.01, release: 0.1 },
      { freq: 200, type: 'bandpass' as BiquadFilterType, threshold: -18, ratio: 3, attack: 0.005, release: 0.08 },
      { freq: 2000, type: 'highpass' as BiquadFilterType, threshold: -16, ratio: 2.5, attack: 0.003, release: 0.06 }
    ];

    bandConfigs.forEach(config => {
      const filter = this.context.createBiquadFilter();
      filter.type = config.type;
      filter.frequency.value = config.freq;
      filter.Q.value = 0.7;

      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = config.threshold;
      compressor.ratio.value = config.ratio;
      compressor.attack.value = config.attack;
      compressor.release.value = config.release;
      compressor.knee.value = 6;

      const gain = this.context.createGain();
      gain.gain.value = 1;

      this.input.connect(filter);
      filter.connect(compressor);
      compressor.connect(gain);
      gain.connect(this.output);

      this.bands.push({ filter, compressor, gain });
    });
  }

  getInput(): AudioNode { return this.input; }
  getOutput(): AudioNode { return this.output; }
}

export class StereoProcessor {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private splitter: ChannelSplitterNode;
  private merger: ChannelMergerNode;
  private midGain: GainNode;
  private sideGain: GainNode;

  constructor(context: AudioContext) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();
    this.splitter = context.createChannelSplitter(2);
    this.merger = context.createChannelMerger(2);
    this.midGain = context.createGain();
    this.sideGain = context.createGain();
    this.setup();
  }

  private setup() {
    this.input.connect(this.splitter);
    // ساده‌شده: Mid(L+R) و Side(L)
    this.splitter.connect(this.midGain, 0);
    this.splitter.connect(this.midGain, 1);
    this.splitter.connect(this.sideGain, 0);

    this.midGain.connect(this.merger, 0, 0);
    this.midGain.connect(this.merger, 0, 1);
    this.sideGain.connect(this.merger, 0, 0);

    this.merger.connect(this.output);
  }

  setWidth(width: number) {
    const clamped = clamp(width, 0, 2);
    this.sideGain.gain.value = clamped;
  }

  getInput(): AudioNode { return this.input; }
  getOutput(): AudioNode { return this.output; }
}

export class ProfessionalAudioChain {
  public input: GainNode;
  public output: AudioNode;
  public eq: AdvancedEQChain | null = null;
  public compressor: MultibandCompressor | null = null;
  public stereoProcessor: StereoProcessor | null = null;
  public limiter: DynamicsCompressorNode | null = null;

  constructor(private context: AudioContext, private options: {
    advancedEQ?: boolean;
    eqBands?: EQBand[];
    multibandCompression?: boolean;
    stereoWidthControl?: boolean;
  }) {
    this.input = context.createGain();
    let current: AudioNode = this.input;

    if (options.advancedEQ && options.eqBands) {
      this.eq = new AdvancedEQChain(context, options.eqBands);
      current.connect(this.eq.getInput());
      current = this.eq.getOutput();
    }

    if (options.multibandCompression) {
      this.compressor = new MultibandCompressor(context);
      current.connect(this.compressor.getInput());
      current = this.compressor.getOutput();
    }

    if (options.stereoWidthControl) {
      this.stereoProcessor = new StereoProcessor(context);
      current.connect(this.stereoProcessor.getInput());
      current = this.stereoProcessor.getOutput();
    }

    this.limiter = context.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001;
    this.limiter.release.value = 0.01;
    this.limiter.knee.value = 0;

    current.connect(this.limiter);
    this.output = this.limiter;
  }
}
