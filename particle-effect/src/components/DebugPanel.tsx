type DebugPanelProps = {
  open: boolean
  onToggle: () => void
  onAudioUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void
  onTogglePlayback: () => void
  bass: number
  treble: number
  bassPulse: number
  treblePulse: number
  bassDelta: number
  trebleDelta: number
  spectrumBars: number[]
  hasAudio: boolean
  isPlaying: boolean
  audioName: string
  jitterStrength: number
  bassJitterGain: number
  onBassJitterGainChange: (value: string) => void
  audioDebug: {
    fftSize: number
    smoothing: number
    bassBinCount: number
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
  treble,
  bassPulse,
  treblePulse,
  bassDelta,
  trebleDelta,
  spectrumBars,
  hasAudio,
  isPlaying,
  audioName,
  jitterStrength,
  bassJitterGain,
  onBassJitterGainChange,
  audioDebug,
}: DebugPanelProps) {
  const estimatedJitter = jitterStrength + bass * bassJitterGain

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
              <span>Bass Gain</span>
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
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Spectrum</span>
            <strong>{spectrumBars.length} Bars</strong>
          </div>
          <div className="debug-spectrum" aria-label="音频频谱柱状图">
            {spectrumBars.map((value, index) => (
              <span
                key={`bar-${index}`}
                className="debug-spectrum__bar"
                style={{ height: `${Math.max(8, value * 100)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="debug-grid">
          <div className="debug-card">
            <span>Bass</span>
            <strong>{bass.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Treble</span>
            <strong>{treble.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Bass Pulse</span>
            <strong>{bassPulse.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Treble Pulse</span>
            <strong>{treblePulse.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Bass Delta</span>
            <strong>{bassDelta.toFixed(3)}</strong>
          </div>
          <div className="debug-card">
            <span>Treble Delta</span>
            <strong>{trebleDelta.toFixed(3)}</strong>
          </div>
        </div>

        <div className="debug-panel__block">
          <div className="debug-row">
            <span>Low Band Rule</span>
            <strong>{`Bins 0-${audioDebug.bassBinCount - 1} Avg`}</strong>
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
