import { useEffect, useMemo, useRef, useState } from 'react'
import targetImg from './assets/target.png'
import TopNav from './components/TopNav'
import DebugPanel from './components/DebugPanel'
import ParticleEffect from './components/ParticleEffect'
import { useAudio } from './components/ParticleEffect/useAudio'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './App.css'

type ParticleSettings = {
  gap: number
  imageScale: number
  mouseRadius: number
  stiffness: number
  damping: number
  jitterStrength: number
  bassJitterGain: number
  midJitterGain: number
  trebleJitterGain: number
  audioCurveStrength: number
  audioCurveCenter: number
  audioCurveSlope: number
  highlightPulseThreshold: number
  highlightPulseDecay: number
  highlightFlashRatio: number
  particleSize: number
  repelStrength: number
}

type SliderField = {
  key: keyof ParticleSettings
  label: string
  min: number
  max: number
  step: number
  format?: (value: number) => string
}

const DEFAULT_PARTICLE_SETTINGS: ParticleSettings = {
  gap: 5,
  imageScale: 0.9,
  mouseRadius: 88,
  stiffness: 0.001,
  damping: 0.96,
  jitterStrength: 0.3,
  bassJitterGain: 1,
  midJitterGain: 0.6,
  trebleJitterGain: 0.35,
  audioCurveStrength: 1,
  audioCurveCenter: 0.5,
  audioCurveSlope: 6,
  highlightPulseThreshold: 0.05,
  highlightPulseDecay: 0.86,
  highlightFlashRatio: 0.01,
  particleSize: 1.2,
  repelStrength: 1,
}

const NAV_ITEMS = ['HOME', 'WORK', 'SETTING', 'ABOUT']

const SLIDER_FIELDS: SliderField[] = [
  { key: 'gap', label: 'Gap', min: 2, max: 8, step: 1, format: (value) => value.toFixed(0) },
  { key: 'imageScale', label: 'Scale', min: 0.4, max: 1.2, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'mouseRadius', label: 'Radius', min: 40, max: 180, step: 1, format: (value) => value.toFixed(0) },
  { key: 'stiffness', label: 'Stiffness', min: 0.001, max: 0.04, step: 0.001, format: (value) => value.toFixed(3) },
  { key: 'damping', label: 'Damping', min: 0.5, max: 0.99, step: 0.01, format: (value) => value.toFixed(2) },
  { key: 'jitterStrength', label: 'Jitter', min: 0, max: 1.2, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'particleSize', label: 'Size', min: 1, max: 4, step: 0.1, format: (value) => value.toFixed(1) },
  { key: 'repelStrength', label: 'Repel', min: 0.2, max: 4, step: 0.1, format: (value) => value.toFixed(1) },
]

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_PARTICLE_SETTINGS)
  const [uploadedImage, setUploadedImage] = useState<{ src: string; name: string } | null>(null)
  const [imageReloadVersion, setImageReloadVersion] = useState(0)
  const [highlightPulse, setHighlightPulse] = useState(0)
  const [highlightTriggerId, setHighlightTriggerId] = useState(0)
  const [weightedDelta, setWeightedDelta] = useState(0)
  const previousWeightedInputRef = useRef(0)
  const highlightTriggerArmedRef = useRef(true)
  const {
    bass,
    mid,
    treble,
    spectrumBars,
    audioName,
    hasAudio,
    isPlaying,
    currentTime,
    duration,
    audioStateRef,
    audioDebug,
    loadAudio,
    playAudio,
    pauseAudio,
    seekAudio,
  } = useAudio()

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.src)
      }
    }
  }, [uploadedImage])

  const activeImageSrc = uploadedImage?.src ?? targetImg
  const activeImageLabel = uploadedImage?.name ?? 'Default target image'
  const toggleSettings = () => setSettingsOpen((open) => !open)
  const toggleDebug = () => setDebugOpen((open) => !open)
  const reloadImage = () => setImageReloadVersion((version) => version + 1)
  const totalGain = settings.bassJitterGain + settings.midJitterGain + settings.trebleJitterGain
  const weightedInput =
    totalGain > 0
      ? (bass * settings.bassJitterGain + mid * settings.midJitterGain + treble * settings.trebleJitterGain) / totalGain
      : 0

  useEffect(() => {
    const nextWeightedDelta = Math.max(0, weightedInput - previousWeightedInputRef.current)
    const aboveThreshold = nextWeightedDelta > settings.highlightPulseThreshold
    setWeightedDelta(nextWeightedDelta)
    if (aboveThreshold && highlightTriggerArmedRef.current) {
      setHighlightTriggerId((current) => current + 1)
      highlightTriggerArmedRef.current = false
    } else if (!aboveThreshold) {
      highlightTriggerArmedRef.current = true
    }
    setHighlightPulse((current) => {
      const nextPulse = aboveThreshold ? 1 : current * settings.highlightPulseDecay
      return Math.max(0, Math.min(1, nextPulse))
    })
    previousWeightedInputRef.current = weightedInput
  }, [settings.highlightPulseDecay, settings.highlightPulseThreshold, weightedInput])

  useEffect(() => {
    audioStateRef.current.weightedInput = weightedInput
    audioStateRef.current.weightedDelta = weightedDelta
    audioStateRef.current.highlightPulse = highlightPulse
    audioStateRef.current.highlightTriggerId = highlightTriggerId
  }, [audioStateRef, highlightPulse, highlightTriggerId, weightedDelta, weightedInput])

  const sliderItems = useMemo(
    () =>
      SLIDER_FIELDS.map((field) => ({
        ...field,
        value: settings[field.key],
        displayValue: field.format ? field.format(settings[field.key]) : String(settings[field.key]),
      })),
    [settings],
  )

  const handleSliderChange = (key: keyof ParticleSettings, value: string) => {
    setSettings((current) => ({
      ...current,
      [key]: Number(value),
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const nextImage = {
      src: URL.createObjectURL(file),
      name: file.name,
    }

    setUploadedImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.src)
      }

      return nextImage
    })

    event.target.value = ''
  }

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    await loadAudio(file)
    event.target.value = ''
  }

  const restoreDefaultImage = () => {
    setUploadedImage((current) => {
      if (current) {
        URL.revokeObjectURL(current.src)
      }

      return null
    })
  }

  return (
    <main className="app-shell">
      <TopNav items={NAV_ITEMS} />
      <ParticleEffect
        key={`${activeImageSrc}-${imageReloadVersion}`}
        className="particle-effect"
        imageSrc={activeImageSrc}
        particleColor={0xffffff}
        audioStateRef={audioStateRef}
        {...settings}
      />
      <section className="settings-dock" aria-label="粒子设置">
        <aside
          id="particle-settings-panel"
          className={`settings-panel ${settingsOpen ? 'settings-panel--open' : ''}`}
        >
          <div className="settings-panel__header">
            <div>
              <p className="settings-panel__eyebrow">Live Controls</p>
              <h2>Particle Settings</h2>
            </div>
            <button
              type="button"
              className="settings-panel__close"
              onClick={() => setSettingsOpen(false)}
              aria-label="关闭设置面板"
            >
              CLOSE
            </button>
          </div>

          <div className="upload-row">
            <label className="upload-button">
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              Upload Image
            </label>
            <button type="button" className="secondary-button" onClick={reloadImage}>
              Reload Image
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={restoreDefaultImage}
              disabled={!uploadedImage}
            >
              Use Default
            </button>
          </div>

          <p className="settings-panel__file">{activeImageLabel}</p>

          <div className="slider-list">
            {sliderItems.map((item) => (
              <label key={item.key} className="slider-control">
                <span className="slider-control__meta">
                  <span>{item.label}</span>
                  <strong>{item.displayValue}</strong>
                </span>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={item.value}
                  onChange={(event) => handleSliderChange(item.key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </aside>

        <button
          type="button"
          className={`settings-trigger ${settingsOpen ? 'settings-trigger--active' : ''}`}
          onClick={toggleSettings}
          aria-expanded={settingsOpen}
          aria-controls="particle-settings-panel"
        >
          SETTING
        </button>
      </section>
      <DebugPanel
        open={debugOpen}
        onToggle={toggleDebug}
        onAudioUpload={handleAudioUpload}
        onPlayAudio={() => void playAudio()}
        onPauseAudio={pauseAudio}
        onSeekAudio={seekAudio}
        bass={bass}
        mid={mid}
        treble={treble}
        spectrumBars={spectrumBars}
        hasAudio={hasAudio}
        isPlaying={isPlaying}
        audioName={audioName}
        currentTime={currentTime}
        duration={duration}
        weightedInput={weightedInput}
        weightedDelta={weightedDelta}
        highlightPulse={highlightPulse}
        jitterStrength={settings.jitterStrength}
        bassJitterGain={settings.bassJitterGain}
        midJitterGain={settings.midJitterGain}
        trebleJitterGain={settings.trebleJitterGain}
        audioCurveStrength={settings.audioCurveStrength}
        audioCurveCenter={settings.audioCurveCenter}
        audioCurveSlope={settings.audioCurveSlope}
        highlightPulseThreshold={settings.highlightPulseThreshold}
        highlightPulseDecay={settings.highlightPulseDecay}
        highlightFlashRatio={settings.highlightFlashRatio}
        onBassJitterGainChange={(value) => handleSliderChange('bassJitterGain', value)}
        onMidJitterGainChange={(value) => handleSliderChange('midJitterGain', value)}
        onTrebleJitterGainChange={(value) => handleSliderChange('trebleJitterGain', value)}
        onAudioCurveStrengthChange={(value) => handleSliderChange('audioCurveStrength', value)}
        onAudioCurveCenterChange={(value) => handleSliderChange('audioCurveCenter', value)}
        onAudioCurveSlopeChange={(value) => handleSliderChange('audioCurveSlope', value)}
        onHighlightPulseThresholdChange={(value) => handleSliderChange('highlightPulseThreshold', value)}
        onHighlightPulseDecayChange={(value) => handleSliderChange('highlightPulseDecay', value)}
        onHighlightFlashRatioChange={(value) => handleSliderChange('highlightFlashRatio', value)}
        audioDebug={audioDebug}
      />
      <Analytics />
      <SpeedInsights />
    </main>
  )
}

export default App
