import { useEffect, useRef } from 'react'
import { useParticles } from './useParticles'
import { usePixi } from './usePixi'
import type { ParticleEffectProps } from './types'

const DEFAULT_GAP = 3
const DEFAULT_IMAGE_SCALE = 1
const DEFAULT_MOUSE_RADIUS = 80
const DEFAULT_STIFFNESS = 0.05
const DEFAULT_DAMPING = 0.85
const DEFAULT_JITTER_STRENGTH = 0.3
const DEFAULT_BASS_JITTER_GAIN = 1
const DEFAULT_MID_JITTER_GAIN = 0.6
const DEFAULT_TREBLE_JITTER_GAIN = 0.35
const DEFAULT_AUDIO_CURVE_STRENGTH = 1
const DEFAULT_AUDIO_CURVE_CENTER = 0.5
const DEFAULT_AUDIO_CURVE_SLOPE = 6
const DEFAULT_HIGHLIGHT_PULSE_THRESHOLD = 0.1
const DEFAULT_PARTICLE_SIZE = 1.5
const DEFAULT_PARTICLE_COLOR = 0xffffff
const DEFAULT_ALPHA_THRESHOLD = 128
const DEFAULT_REPEL_STRENGTH = 3.8

export function ParticleEffect({
  imageSrc,
  gap = DEFAULT_GAP,
  imageScale = DEFAULT_IMAGE_SCALE,
  mouseRadius = DEFAULT_MOUSE_RADIUS,
  stiffness = DEFAULT_STIFFNESS,
  damping = DEFAULT_DAMPING,
  jitterStrength = DEFAULT_JITTER_STRENGTH,
  bassJitterGain = DEFAULT_BASS_JITTER_GAIN,
  midJitterGain = DEFAULT_MID_JITTER_GAIN,
  trebleJitterGain = DEFAULT_TREBLE_JITTER_GAIN,
  audioCurveStrength = DEFAULT_AUDIO_CURVE_STRENGTH,
  audioCurveCenter = DEFAULT_AUDIO_CURVE_CENTER,
  audioCurveSlope = DEFAULT_AUDIO_CURVE_SLOPE,
  highlightPulseThreshold = DEFAULT_HIGHLIGHT_PULSE_THRESHOLD,
  particleSize = DEFAULT_PARTICLE_SIZE,
  particleColor = DEFAULT_PARTICLE_COLOR,
  alphaThreshold = DEFAULT_ALPHA_THRESHOLD,
  repelStrength = DEFAULT_REPEL_STRENGTH,
  audioStateRef,
  className,
}: ParticleEffectProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const cursorRingRef = useRef<HTMLDivElement | null>(null)
  const cursorCoreRef = useRef<HTMLSpanElement | null>(null)
  const cursorVisibleRef = useRef(false)
  const cursorTargetRef = useRef({ x: 0, y: 0, active: false })
  const cursorCurrentRef = useRef({ x: 0, y: 0 })
  const particles = useParticles({
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
  })

  const { hostRef } = usePixi({
    sampledImage: particles.sampledImage,
    particlesRef: particles.particlesRef,
    particleColor,
    particleSize,
    audioStateRef,
    highlightPulseThreshold,
    step: particles.step,
    setMousePosition: particles.setMousePosition,
    clearMouse: particles.clearMouse,
  })

  useEffect(() => {
    let frameId = 0

    const animateCursor = () => {
      const ring = cursorRingRef.current
      const core = cursorCoreRef.current
      const target = cursorTargetRef.current
      const current = cursorCurrentRef.current

      current.x += (target.x - current.x) * 0.16
      current.y += (target.y - current.y) * 0.16

      if (ring) {
        const scale = target.active ? 1 : 0.72
        ring.style.opacity = target.active ? '1' : '0'
        ring.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0) scale(${scale})`
      }

      if (core) {
        core.style.opacity = target.active ? '1' : '0'
        core.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate3d(-50%, -50%, 0) scale(${target.active ? 1 : 0.72})`
      }

      frameId = window.requestAnimationFrame(animateCursor)
    }

    frameId = window.requestAnimationFrame(animateCursor)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  useEffect(() => {
    const deactivateCursor = () => {
      cursorTargetRef.current.active = false
      cursorVisibleRef.current = false
    }

    const syncCursor = (event: PointerEvent) => {
      const section = sectionRef.current

      if (!section) {
        deactivateCursor()
        return
      }

      const rect = section.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const insideSection =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom

      if (!insideSection) {
        deactivateCursor()
        return
      }

      cursorTargetRef.current = { x, y, active: true }

      if (!cursorVisibleRef.current) {
        cursorCurrentRef.current = { x, y }
        cursorVisibleRef.current = true
      }
    }

    window.addEventListener('pointermove', syncCursor)
    window.addEventListener('pointerleave', deactivateCursor)

    return () => {
      window.removeEventListener('pointermove', syncCursor)
      window.removeEventListener('pointerleave', deactivateCursor)
    }
  }, [])

  return (
    <section ref={sectionRef} className={className ? `particle-effect ${className}` : 'particle-effect'}>
      <div ref={hostRef} className="particle-stage" aria-label="交互粒子画布" />
      <div ref={cursorRingRef} className="orb-cursor" aria-hidden="true">
        <span className="orb-cursor__halo" />
        <span className="orb-cursor__ring" />
      </div>
      <span ref={cursorCoreRef} className="orb-cursor__core" aria-hidden="true" />
    </section>
  )
}

export default ParticleEffect
