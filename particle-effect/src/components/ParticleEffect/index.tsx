import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { useParticles } from './useParticles'
import { usePixi } from './usePixi'
import type { ParticleEffectProps } from './types'

const DEFAULT_GAP = 3
const DEFAULT_IMAGE_SCALE = 1
const DEFAULT_MOUSE_RADIUS = 80
const DEFAULT_STIFFNESS = 0.05
const DEFAULT_DAMPING = 0.85
const DEFAULT_JITTER_STRENGTH = 0.3
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
  particleSize = DEFAULT_PARTICLE_SIZE,
  particleColor = DEFAULT_PARTICLE_COLOR,
  alphaThreshold = DEFAULT_ALPHA_THRESHOLD,
  repelStrength = DEFAULT_REPEL_STRENGTH,
  className,
}: ParticleEffectProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null)
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
  })

  const { hostRef } = usePixi({
    sampledImage: particles.sampledImage,
    particlesRef: particles.particlesRef,
    particleColor,
    particleSize,
    step: particles.step,
    setMousePosition: particles.setMousePosition,
    clearMouse: particles.clearMouse,
  })

  useEffect(() => {
    let frameId = 0

    const animateCursor = () => {
      const cursor = cursorRef.current
      const target = cursorTargetRef.current
      const current = cursorCurrentRef.current

      current.x += (target.x - current.x) * 0.16
      current.y += (target.y - current.y) * 0.16

      if (cursor) {
        const scale = target.active ? 1 : 0.72
        cursor.style.opacity = target.active ? '1' : '0'
        cursor.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate3d(-50%, -50%, 0) scale(${scale})`
      }

      frameId = window.requestAnimationFrame(animateCursor)
    }

    frameId = window.requestAnimationFrame(animateCursor)

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  const syncCursor = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    cursorTargetRef.current = { x, y, active: true }

    if (!cursorVisibleRef.current) {
      cursorCurrentRef.current = { x, y }
      cursorVisibleRef.current = true
    }
  }

  const hideCursor = () => {
    cursorTargetRef.current.active = false
    cursorVisibleRef.current = false
  }

  return (
    <section
      className={className ? `particle-effect ${className}` : 'particle-effect'}
      onPointerEnter={syncCursor}
      onPointerMove={syncCursor}
      onPointerLeave={hideCursor}
    >
      <div ref={hostRef} className="particle-stage" aria-label="交互粒子画布" />
      <div ref={cursorRef} className="orb-cursor" aria-hidden="true">
        <span className="orb-cursor__halo" />
        <span className="orb-cursor__ring" />
        <span className="orb-cursor__core" />
      </div>
    </section>
  )
}

export default ParticleEffect
