import { useCallback, useEffect, useRef, useState } from 'react'
import { sampleImageParticles } from './imageSampler'
import type { ParticleData, SampledImage } from './types'

const VIEWPORT_SAMPLE_WIDTH_RATIO = 1.5
const VIEWPORT_SAMPLE_HEIGHT_RATIO = 1.5

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
}: UseParticlesOptions) {
  const particlesRef = useRef<ParticleData[]>([])
  const mouseRef = useRef<MouseState>({ x: 0, y: 0, active: false })
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
      const delta = Math.min(deltaTime, 2.5)
      const mouse = mouseRef.current
      const radiusSquared = mouseRadius * mouseRadius
      const dampingFactor = Math.pow(damping, delta)

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

        particle.vx += (Math.random() - 0.5) * jitterStrength * delta
        particle.vy += (Math.random() - 0.5) * jitterStrength * delta
        particle.vx += (particle.originX - particle.x) * stiffness * delta
        particle.vy += (particle.originY - particle.y) * stiffness * delta
        particle.vx *= dampingFactor
        particle.vy *= dampingFactor
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta
      }
    },
    [damping, jitterStrength, mouseRadius, repelStrength, stiffness],
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
