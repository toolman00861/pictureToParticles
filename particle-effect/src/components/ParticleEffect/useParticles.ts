import { useCallback, useEffect, useRef, useState } from 'react'
import { sampleImageParticles } from './imageSampler'
import type { AudioReactiveState, ParticleData, SampledImage } from './types'

const VIEWPORT_SAMPLE_WIDTH_RATIO = 1.5
const VIEWPORT_SAMPLE_HEIGHT_RATIO = 1.5
const AUDIO_JITTER_SMOOTHING = 0.12

type UseParticlesOptions = {
  imageSrc: string
  gap: number
  imageScale: number
  alphaThreshold: number
  mouseRadius: number
  stiffness: number
  damping: number
  repelStrength: number
  jitterStrength: number
  bassJitterGain: number
  midJitterGain: number
  trebleJitterGain: number
  audioCurveStrength: number
  audioCurveCenter: number
  audioCurveSlope: number
  audioStateRef?: React.RefObject<AudioReactiveState>
}

type MouseState = {
  x: number
  y: number
  active: boolean
}

export function useParticles({
  imageSrc,
  gap,
  imageScale,
  alphaThreshold,
  mouseRadius,
  stiffness,
  damping,
  repelStrength,
  jitterStrength,
  bassJitterGain,
  midJitterGain,
  trebleJitterGain,
  audioCurveStrength,
  audioCurveCenter,
  audioCurveSlope,
  audioStateRef,
}: UseParticlesOptions) {
  const particlesRef = useRef<ParticleData[]>([])
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, active: false })
  const smoothedBassRef = useRef(0)
  const smoothedMidRef = useRef(0)
  const smoothedTrebleRef = useRef(0)
  const [sampledImage, setSampledImage] = useState<SampledImage | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setStatus('loading')
        setError(null)

        const viewportWidth = Math.floor(window.innerWidth * VIEWPORT_SAMPLE_WIDTH_RATIO)
        const viewportHeight = Math.floor(window.innerHeight * VIEWPORT_SAMPLE_HEIGHT_RATIO)
        const result = await sampleImageParticles({
          imageSrc,
          gap,
          imageScale,
          alphaThreshold,
          targetWidth: viewportWidth,
          targetHeight: viewportHeight,
        })

        if (cancelled) {
          return
        }

        const runtimeParticles = result.particles.map((particle) => ({ ...particle }))
        particlesRef.current = runtimeParticles
        setSampledImage(result)
        setStatus('ready')
      } catch (loadError) {
        if (cancelled) {
          return
        }

        const message =
          loadError instanceof Error ? loadError.message : 'Unknown particle sampling error.'

        particlesRef.current = []
        setSampledImage(null)
        setError(message)
        setStatus('error')
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [alphaThreshold, gap, imageScale, imageSrc])

  const setMousePosition = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y, active: true }
  }, [])

  const clearMouse = useCallback(() => {
    mouseRef.current.active = false
  }, [])

  const step = useCallback(
    (deltaTime = 1) => {
      const mapAudioBand = (value: number) => Math.tanh((Math.max(0, value) - audioCurveCenter) * audioCurveSlope) * 0.5 + 0.5
      const delta = Math.min(deltaTime, 2.5)
      const mouse = mouseRef.current
      const radiusSquared = mouseRadius * mouseRadius
      const dampingFactor = Math.pow(damping, delta)
      const bass = audioStateRef?.current?.bass ?? 0
      const mid = audioStateRef?.current?.mid ?? 0
      const treble = audioStateRef?.current?.treble ?? 0
      smoothedBassRef.current += (bass - smoothedBassRef.current) * AUDIO_JITTER_SMOOTHING
      smoothedMidRef.current += (mid - smoothedMidRef.current) * AUDIO_JITTER_SMOOTHING
      smoothedTrebleRef.current += (treble - smoothedTrebleRef.current) * AUDIO_JITTER_SMOOTHING
      const mappedBass = mapAudioBand(smoothedBassRef.current)
      const mappedMid = mapAudioBand(smoothedMidRef.current)
      const mappedTreble = mapAudioBand(smoothedTrebleRef.current)
      const effectiveJitterStrength =
        jitterStrength +
        mappedBass * bassJitterGain * audioCurveStrength +
        mappedMid * midJitterGain * audioCurveStrength +
        mappedTreble * trebleJitterGain * audioCurveStrength

      for (const particle of particlesRef.current) {
        if (mouse.active) {
          const dx = particle.x - mouse.x
          const dy = particle.y - mouse.y
          const distanceSquared = dx * dx + dy * dy

          if (distanceSquared > 0.0001 && distanceSquared < radiusSquared) {
            const distance = Math.sqrt(distanceSquared)
            const falloff = 1 - distance / mouseRadius
            const force = falloff * repelStrength * delta
            const normalX = dx / distance
            const normalY = dy / distance

            particle.vx += normalX * force
            particle.vy += normalY * force
          }
        }

        particle.vx += (Math.random() - 0.5) * effectiveJitterStrength * delta
        particle.vy += (Math.random() - 0.5) * effectiveJitterStrength * delta
        particle.vx += (particle.originX - particle.x) * stiffness * delta
        particle.vy += (particle.originY - particle.y) * stiffness * delta
        particle.vx *= dampingFactor
        particle.vy *= dampingFactor
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta
      }
    },
    [
      audioCurveCenter,
      audioCurveSlope,
      audioCurveStrength,
      audioStateRef,
      bassJitterGain,
      damping,
      jitterStrength,
      midJitterGain,
      mouseRadius,
      repelStrength,
      stiffness,
      trebleJitterGain,
    ],
  )

  return {
    sampledImage,
    particlesRef,
    status,
    error,
    setMousePosition,
    clearMouse,
    step,
  }
}
