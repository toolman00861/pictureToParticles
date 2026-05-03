import { useCallback, useEffect, useRef, useState } from 'react'
import { BASS_BIN_COUNT, TREBLE_START_INDEX, extractBass, extractTreble } from './audioAnalyser'
import type { AudioReactiveState } from './types'

const ANALYSER_FFT_SIZE = 512
const ANALYSER_SMOOTHING = 0.72
const TREBLE_PULSE_THRESHOLD = 0.15
const TREBLE_PULSE_DECAY = 0.85
const BASS_PULSE_THRESHOLD = 0.2
const BASS_PULSE_DECAY = 0.8
const SPECTRUM_BAR_COUNT = 32

function buildSpectrumBars(dataArray: ArrayLike<number>) {
  const bars = Array.from({ length: SPECTRUM_BAR_COUNT }, () => 0)
  if (dataArray.length === 0) {
    return bars
  }

  const bucketSize = Math.max(1, Math.floor(dataArray.length / SPECTRUM_BAR_COUNT))
  for (let barIndex = 0; barIndex < SPECTRUM_BAR_COUNT; barIndex += 1) {
    const start = barIndex * bucketSize
    const end = Math.min(dataArray.length, start + bucketSize)
    if (start >= dataArray.length || end <= start) {
      continue
    }

    let total = 0
    for (let index = start; index < end; index += 1) {
      total += dataArray[index]
    }

    bars[barIndex] = total / (end - start) / 255
  }

  return bars
}

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const frameRef = useRef(0)
  const lastBassRef = useRef(0)
  const lastTrebleRef = useRef(0)
  const bassPulseRef = useRef(0)
  const treblePulseRef = useRef(0)
  const audioStateRef = useRef<AudioReactiveState>({ bass: 0, treble: 0, bassPulse: 0, treblePulse: 0 })

  const [bass, setBass] = useState(0)
  const [treble, setTreble] = useState(0)
  const [bassPulse, setBassPulse] = useState(0)
  const [treblePulse, setTreblePulse] = useState(0)
  const [bassDelta, setBassDelta] = useState(0)
  const [trebleDelta, setTrebleDelta] = useState(0)
  const [spectrumBars, setSpectrumBars] = useState<number[]>(() =>
    Array.from({ length: SPECTRUM_BAR_COUNT }, () => 0),
  )
  const [audioName, setAudioName] = useState('未加载音频')
  const [hasAudio, setHasAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const stopAnalysis = useCallback(() => {
    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    audioStateRef.current.bass = 0
    audioStateRef.current.treble = 0
    audioStateRef.current.bassPulse = 0
    audioStateRef.current.treblePulse = 0
    lastBassRef.current = 0
    lastTrebleRef.current = 0
    bassPulseRef.current = 0
    treblePulseRef.current = 0
    setBass(0)
    setTreble(0)
    setBassPulse(0)
    setTreblePulse(0)
    setBassDelta(0)
    setTrebleDelta(0)
    setSpectrumBars(Array.from({ length: SPECTRUM_BAR_COUNT }, () => 0))
  }, [])

  const ensureAudioGraph = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (!audioContextRef.current) {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = ANALYSER_FFT_SIZE
      analyser.smoothingTimeConstant = ANALYSER_SMOOTHING

      const source = audioContext.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      sourceRef.current = source
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [])

  const startAnalysis = useCallback(() => {
    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current
    const audio = audioRef.current

    if (!analyser || !dataArray || !audio) {
      return
    }

    const tick = () => {
      if (audio.paused || audio.ended) {
        stopAnalysis()
        return
      }

      analyser.getByteFrequencyData(dataArray)

      const nextBass = extractBass(dataArray)
      const nextTreble = extractTreble(dataArray)
      const bassDelta = nextBass - lastBassRef.current
      const trebleDelta = nextTreble - lastTrebleRef.current
      const nextSpectrumBars = buildSpectrumBars(dataArray)

      if (bassDelta > BASS_PULSE_THRESHOLD) {
        bassPulseRef.current = 1
      }

      if (trebleDelta > TREBLE_PULSE_THRESHOLD) {
        treblePulseRef.current = 1
      }

      bassPulseRef.current *= BASS_PULSE_DECAY
      treblePulseRef.current *= TREBLE_PULSE_DECAY
      lastBassRef.current = nextBass
      lastTrebleRef.current = nextTreble

      audioStateRef.current.bass = nextBass
      audioStateRef.current.treble = nextTreble
      audioStateRef.current.bassPulse = bassPulseRef.current
      audioStateRef.current.treblePulse = treblePulseRef.current
      setBass(nextBass)
      setTreble(nextTreble)
      setBassPulse(bassPulseRef.current)
      setTreblePulse(treblePulseRef.current)
      setBassDelta(bassDelta)
      setTrebleDelta(trebleDelta)
      setSpectrumBars(nextSpectrumBars)

      frameRef.current = window.requestAnimationFrame(tick)
    }

    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = window.requestAnimationFrame(tick)
  }, [stopAnalysis])

  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'
    audio.loop = true
    audioRef.current = audio

    const handlePlay = () => {
      setIsPlaying(true)
      startAnalysis()
    }

    const handlePause = () => {
      setIsPlaying(false)
      stopAnalysis()
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handlePause)

    return () => {
      audio.pause()
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handlePause)
      stopAnalysis()

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      sourceRef.current?.disconnect()
      analyserRef.current?.disconnect()
      void audioContextRef.current?.close()
    }
  }, [startAnalysis, stopAnalysis])

  const loadAudio = useCallback(
    async (file: File) => {
      const audio = audioRef.current
      if (!audio) {
        return
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }

      const objectUrl = URL.createObjectURL(file)
      objectUrlRef.current = objectUrl
      audio.src = objectUrl
      audio.load()

      setAudioName(file.name)
      setHasAudio(true)

      await ensureAudioGraph()

      try {
        await audio.play()
      } catch {
        setIsPlaying(false)
      }
    },
    [ensureAudioGraph],
  )

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !hasAudio) {
      return
    }

    if (audio.paused) {
      await ensureAudioGraph()
      try {
        await audio.play()
      } catch {
        setIsPlaying(false)
      }
      return
    }

    audio.pause()
  }, [ensureAudioGraph, hasAudio])

  return {
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
    audioDebug: {
      fftSize: ANALYSER_FFT_SIZE,
      smoothing: ANALYSER_SMOOTHING,
      bassBinCount: BASS_BIN_COUNT,
      trebleStartIndex: TREBLE_START_INDEX,
      bassPulseThreshold: BASS_PULSE_THRESHOLD,
      treblePulseThreshold: TREBLE_PULSE_THRESHOLD,
      bassPulseDecay: BASS_PULSE_DECAY,
      treblePulseDecay: TREBLE_PULSE_DECAY,
    },
    loadAudio,
    togglePlayback,
  }
}
