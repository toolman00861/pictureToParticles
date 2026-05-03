type DebugPanelProps = {
  open: boolean
  onToggle: () => void
  onAudioUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void
  onTogglePlayback: () => void
  bass: number
  mid: number
  treble: number
  bassPulse: number
  treblePulse: number
  bassDelta: number
  midDelta: number
  trebleDelta: number
  spectrumBars: number[]
  hasAudio: boolean
  isPlaying: boolean
  audioName: string
  jitterStrength: number
  bassJitterGain: number
  midJitterGain: number
  trebleJitterGain: number
  audioCurveStrength: number
  audioCurveCenter: number
  audioCurveSlope: number
  onBassJitterGainChange: (value: string) => void
  onMidJitterGainChange: (value: string) => void
  onTrebleJitterGainChange: (value: string) => void
  onAudioCurveStrengthChange: (value: string) => void
  onAudioCurveCenterChange: (value: string) => void
  onAudioCurveSlopeChange: (value: string) => void
  audioDebug: {
    fftSize: number
    smoothing: number
    bassBinCount: number
    midStartIndex: number
    midEndIndex: number
    trebleStartIndex: number
    bassPulseThreshold: number
    treblePulseThreshold: number
    bassPulseDecay: number
    treblePulseDecay: number
  }
}

export function DebugPanel({
  open,
  onToggle,
  onAudioUpload,
  onTogglePlayback,
  bass,
  mid,
  treble,
  bassPulse,
  treblePulse,
  bassDelta,
  midDelta,
  trebleDelta,
  spectrumBars,
  hasAudio,
  isPlaying,
  audioName,
  jitterStrength,
  bassJitterGain,
  midJitterGain,
  trebleJitterGain,
  audioCurveStrength,
  audioCurveCenter,
  audioCurveSlope,
  onBassJitterGainChange,
  onMidJitterGainChange,
  onTrebleJitterGainChange,
  onAudioCurveStrengthChange,
  onAudioCurveCenterChange,
  onAudioCurveSlopeChange,
  audioDebug,
}: DebugPanelProps) {
  const mapAudioBand = (value: number) => Math.tanh((Math.max(0, value) - audioCurveCenter) * audioCurveSlope) * 0.5 + 0.5
  const mappedBass = mapAudioBand(bass)
  const mappedMid = mapAudioBand(mid)
  const mappedTreble = mapAudioBand(treble)
  const totalGain = bassJitterGain + midJitterGain + trebleJitterGain
  const weightedInput =
    totalGain > 0
      ? (bass * bassJitterGain + mid * midJitterGain + treble * trebleJitterGain) / totalGain
      : 0
  const weightedMapped = mapAudioBand(weightedInput)
  const weightedDelta =
    totalGain > 0
      ? (bassDelta * bassJitterGain + midDelta * midJitterGain + trebleDelta * trebleJitterGain) / totalGain
      : 0
  const lowShare = totalGain > 0 ? (bass * bassJitterGain) / totalGain : 0
  const midShare = totalGain > 0 ? (mid * midJitterGain) / totalGain : 0
  const highShare = totalGain > 0 ? (treble * trebleJitterGain) / totalGain : 0
  const weightedPulse =
    bassJitterGain + trebleJitterGain > 0
      ? (bassPulse * bassJitterGain + treblePulse * trebleJitterGain) / (bassJitterGain + trebleJitterGain)
      : 0
  const estimatedJitter =
    jitterStrength +
    mappedBass * bassJitterGain * audioCurveStrength +
    mappedMid * midJitterGain * audioCurveStrength +
    mappedTreble * trebleJitterGain * audioCurveStrength
  const spectrumBandSize = Math.max(1, Math.floor(spectrumBars.length / 3))
  const curvePath = Array.from({ length: 41 }, (_, index) => {
    const x = index / 40
    const y = mapAudioBand(x)
    const px = x * 100
    const py = (1 - y) * 100
    return `${px},${py}`
  }).join(' ')

  return (
    <section className="debug-dock" aria-label="调试面板">
      <aside id="debug-panel" className={`debug-panel ${open ? 'debug-panel--open' : ''}`}>
        <div className="debug-panel__header">
          <div>
            <p className="debug-panel__eyebrow">Audio Controls</p>
            <h2>Audio Settings</h2>
          </div>
          <button
            type="button"
            className="debug-panel__close"
            onClick={onToggle}
            aria-label="关闭调试面板"
          >
            CLOSE
          </button>
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Audio</span>
            <strong>{hasAudio ? audioName : '未加载音频'}</strong>
          </div>
          <div className="debug-row">
            <span>Status</span>
            <strong>{hasAudio ? (isPlaying ? 'Playing' : 'Paused') : 'Idle'}</strong>
          </div>
          <div className="upload-row">
            <label className="upload-button">
              <input type="file" accept="audio/*" onChange={onAudioUpload} />
              Upload Audio
            </label>
            <button
              type="button"
              className="secondary-button"
              onClick={onTogglePlayback}
              disabled={!hasAudio}
            >
              {isPlaying ? 'Pause Audio' : 'Play Audio'}
            </button>
          </div>
        </div>

        <div className="debug-panel__block">
          <label className="slider-control">
            <span className="slider-control__meta">
              <span>Low Gain</span>
              <strong>{bassJitterGain.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={bassJitterGain}
              onChange={(event) => onBassJitterGainChange(event.target.value)}
            />
          </label>
          <label className="slider-control">
            <span className="slider-control__meta">
              <span>Mid Gain</span>
              <strong>{midJitterGain.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={midJitterGain}
              onChange={(event) => onMidJitterGainChange(event.target.value)}
            />
          </label>
          <label className="slider-control">
            <span className="slider-control__meta">
              <span>High Gain</span>
              <strong>{trebleJitterGain.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={trebleJitterGain}
              onChange={(event) => onTrebleJitterGainChange(event.target.value)}
            />
          </label>
          <label className="slider-control">
            <span className="slider-control__meta">
              <span>Curve Strength</span>
              <strong>{audioCurveStrength.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="4"
              step="0.05"
              value={audioCurveStrength}
              onChange={(event) => onAudioCurveStrengthChange(event.target.value)}
            />
          </label>
          <label className="slider-control">
            <span className="slider-control__meta">
              <span>Curve Center</span>
              <strong>{audioCurveCenter.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioCurveCenter}
              onChange={(event) => onAudioCurveCenterChange(event.target.value)}
            />
          </label>
          <label className="slider-control">
            <span className="slider-control__meta">
              <span>Curve Slope</span>
              <strong>{audioCurveSlope.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={audioCurveSlope}
              onChange={(event) => onAudioCurveSlopeChange(event.target.value)}
            />
          </label>
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Curve Preview</span>
            <strong>{`avg ${weightedInput.toFixed(3)} -> ${weightedMapped.toFixed(3)}`}</strong>
          </div>
          <div className="debug-curve">
            <svg viewBox="0 0 100 100" className="debug-curve__svg" aria-label="音频映射曲线预览">
              <line x1="0" y1="50" x2="100" y2="50" className="debug-curve__axis" />
              <line x1="50" y1="0" x2="50" y2="100" className="debug-curve__axis" />
              <polyline points={curvePath} className="debug-curve__line" />
              <circle
                cx={weightedInput * 100}
                cy={(1 - weightedMapped) * 100}
                r="3.1"
                className="debug-curve__point debug-curve__point--weighted"
              />
            </svg>
          </div>
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Spectrum</span>
            <strong>{spectrumBars.length} Bars</strong>
          </div>
          <div className="debug-legend" aria-label="频段颜色图例">
            <span className="debug-legend__item debug-legend__item--low">Low</span>
            <span className="debug-legend__item debug-legend__item--mid">Mid</span>
            <span className="debug-legend__item debug-legend__item--high">High</span>
          </div>
          <div className="debug-spectrum" aria-label="音频频谱柱状图">
            {spectrumBars.map((value, index) => (
              <span
                key={`bar-${index}`}
                className={`debug-spectrum__bar ${
                  index < spectrumBandSize
                    ? 'debug-spectrum__bar--low'
                    : index < spectrumBandSize * 2
                      ? 'debug-spectrum__bar--mid'
                      : 'debug-spectrum__bar--high'
                }`}
                style={{ height: `${Math.max(8, value * 100)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="debug-grid">
          <div className="debug-card">
            <span>Weighted In</span>
            <strong>{weightedInput.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Weighted Out</span>
            <strong>{weightedMapped.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Weighted Delta</span>
            <strong>{weightedDelta.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Weighted Pulse</span>
            <strong>{weightedPulse.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Low Share</span>
            <strong>{lowShare.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Mid Share</span>
            <strong>{midShare.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>High Share</span>
            <strong>{highShare.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Total Gain</span>
            <strong>{totalGain.toFixed(2)}</strong>
          </div>
          <div className="debug-card">
            <span>Estimated Jitter</span>
            <strong>{estimatedJitter.toFixed(2)}</strong>
          </div>
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Low Band Rule</span>
            <strong>{`Bins 0-${audioDebug.bassBinCount - 1} Avg`}</strong>
          </div>
          <div className="debug-row">
            <span>Mid Band View</span>
            <strong>{`Bars ${spectrumBandSize}-${spectrumBandSize * 2 - 1}`}</strong>
          </div>
          <div className="debug-row">
            <span>Mid Rule</span>
            <strong>{`Bins ${audioDebug.midStartIndex}-${audioDebug.midEndIndex - 1} Avg`}</strong>
          </div>
          <div className="debug-row">
            <span>High Band Rule</span>
            <strong>{`Bins ${audioDebug.trebleStartIndex}+ Avg`}</strong>
          </div>
          <div className="debug-row">
            <span>FFT / Smooth</span>
            <strong>{`${audioDebug.fftSize} / ${audioDebug.smoothing.toFixed(2)}`}</strong>
          </div>
          <div className="debug-row">
            <span>Curve</span>
            <strong>{`tanh((x - ${audioCurveCenter.toFixed(2)}) * ${audioCurveSlope.toFixed(2)}) * 0.5 + 0.5`}</strong>
          </div>
          <div className="debug-row">
            <span>Curve Strength</span>
            <strong>{audioCurveStrength.toFixed(2)}</strong>
          </div>
          <div className="debug-row">
            <span>Bass Threshold</span>
            <strong>{audioDebug.bassPulseThreshold.toFixed(2)}</strong>
          </div>
          <div className="debug-row">
            <span>Treble Threshold</span>
            <strong>{audioDebug.treblePulseThreshold.toFixed(2)}</strong>
          </div>
          <div className="debug-row">
            <span>Bass Decay</span>
            <strong>{audioDebug.bassPulseDecay.toFixed(2)}</strong>
          </div>
          <div className="debug-row">
            <span>Treble Decay</span>
            <strong>{audioDebug.treblePulseDecay.toFixed(2)}</strong>
          </div>
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Base Jitter Ref</span>
            <strong>{jitterStrength.toFixed(2)}</strong>
          </div>
          <div className="debug-row">
            <span>Low / Mid / High</span>
            <strong>{`${bassJitterGain.toFixed(2)} / ${midJitterGain.toFixed(2)} / ${trebleJitterGain.toFixed(2)}`}</strong>
          </div>
          <div className="debug-row">
            <span>Curve Mix</span>
            <strong>{`${audioCurveStrength.toFixed(2)} x`}</strong>
          </div>
          <div className="debug-row">
            <span>Estimated Jitter</span>
            <strong>{estimatedJitter.toFixed(2)}</strong>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className={`debug-trigger ${open ? 'debug-trigger--active' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="debug-panel"
      >
        AUDIO
      </button>
    </section>
  )
}

export default DebugPanel
