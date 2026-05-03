import { useEffect, useMemo, useState } from 'react'
import targetImg from './assets/target.png'
import TopNav from './components/TopNav'
import DebugPanel from './components/DebugPanel'
import ParticleEffect from './components/ParticleEffect'
import { useAudio } from './components/ParticleEffect/useAudio'
import './App.css'

type ParticleSettings = {
  gap: number
  imageScale: number
  mouseRadius: number
  stiffness: number
  damping: number
  jitterStrength: number
  bassJitterGain: number
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
  gap: 3,
  imageScale: 0.9,
  mouseRadius: 88,
  stiffness: 0.001,
  damping: 0.96,
  jitterStrength: 0.4,
  bassJitterGain: 1,
  particleSize: 2,
  repelStrength: 1,
}

const NAV_ITEMS = ['HOME', 'WORK', 'SETTING', 'ABOUT']

const SLIDER_FIELDS: SliderField[] = [
  { key: 'gap', label: 'Gap', min: 2, max: 8, step: 1, format: (value) => value.toFixed(0) },
  { key: 'imageScale', label: 'Scale', min: 0.4, max: 1.2, step: 0.05, format: (value) => value.toFixed(2) },
  { key: 'mouseRadius', label: 'Radius', min: 40, max: 180, step: 1, format: (value) => value.toFixed(0) },
  { key: 'stiffness', label: 'Stiffness', min: 0.001, max: 0.04, step: 0.001, format: (value) => value.toFixed(3) },
  { key: 'damping', label: 'Damping', min: 0.88, max: 0.99, step: 0.01, format: (value) => value.toFixed(2) },
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
  const {
    bass,
    treble,
    bassPulse,
    treblePulse,
    bassDelta,
    trebleDelta,
    spectrumBars,
    audioName,
    hasAudio,
    isPlaying,
    audioStateRef,
    audioDebug,
    loadAudio,
    togglePlayback,
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
        onTogglePlayback={() => void togglePlayback()}
        bass={bass}
        treble={treble}
        bassPulse={bassPulse}
        treblePulse={treblePulse}
        bassDelta={bassDelta}
        trebleDelta={trebleDelta}
        spectrumBars={spectrumBars}
        hasAudio={hasAudio}
        isPlaying={isPlaying}
        audioName={audioName}
        jitterStrength={settings.jitterStrength}
        bassJitterGain={settings.bassJitterGain}
        onBassJitterGainChange={(value) => handleSliderChange('bassJitterGain', value)}
        audioDebug={audioDebug}
      />
    </main>
  )
}

export default App
