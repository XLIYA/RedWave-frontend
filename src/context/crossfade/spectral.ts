export class SpectralAnalyzer {
  private analyzer: AnalyserNode;
  private bufferSize: number;
  private frequencyData: Uint8Array<ArrayBuffer>;
  private timeData: Uint8Array<ArrayBuffer>;

  constructor(context: AudioContext, audioNode: AudioNode) {
    this.analyzer = context.createAnalyser();
    this.bufferSize = 2048;
    this.analyzer.fftSize = this.bufferSize;
    this.analyzer.smoothingTimeConstant = 0.8;

    // TS 5.5+: امضای DOM ممکن است Uint8Array<ArrayBuffer> بخواهد
    this.frequencyData = new Uint8Array(this.analyzer.frequencyBinCount) as unknown as Uint8Array<ArrayBuffer>;
    this.timeData = new Uint8Array(this.bufferSize) as unknown as Uint8Array<ArrayBuffer>;

    audioNode.connect(this.analyzer);
  }

  getSpectralCentroid(): number {
    this.analyzer.getByteFrequencyData(this.frequencyData);
    let weightedSum = 0, magnitude = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      const freq = (i * 22050) / this.frequencyData.length; // فرض 44.1kHz
      const mag = this.frequencyData[i] / 255;
      weightedSum += freq * mag * mag;
      magnitude += mag * mag;
    }
    return magnitude > 0 ? weightedSum / magnitude : 0;
  }

  getRMS(): number {
    this.analyzer.getByteTimeDomainData(this.timeData);
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const sample = (this.timeData[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / this.timeData.length);
  }

  detectTransients(): boolean {
    const rms = this.getRMS();
    const centroid = this.getSpectralCentroid();
    return rms > 0.3 && centroid > 2000;
  }
}
