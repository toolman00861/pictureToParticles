import { useEffect, useRef } from 'react'
import {
  Application,
  Graphics,
  Particle as PixiParticle,
  ParticleContainer,
  type Texture,
} from 'pixi.js'
import type { AudioReactiveState, ParticleData, SampledImage } from './types'

const GLOW_RADIUS = 6
const CORE_RADIUS = 1.6
const PARTICLE_SCALE_FACTOR = 0.18
const BASE_PARTICLE_ALPHA = 0.62
const TREBLE_PULSE_SCALE_BOOST = 2

function brightenColor(color: number, intensity: number) {
  const clampedIntensity = Math.max(0, Math.min(intensity, 1))
  const red = (color >> 16) & 0xff
  const green = (color >> 8) & 0xff
  const blue = color & 0xff

  const nextRed = Math.round(red + (255 - red) * clampedIntensity)
  const nextGreen = Math.round(green + (255 - green) * clampedIntensity)
  const nextBlue = Math.round(blue + (255 - blue) * clampedIntensity)

  return (nextRed << 16) | (nextGreen << 8) | nextBlue
}

function createParticleTexture(app: Application): Texture {
  const glowGraphic = new Graphics()
    .circle(0, 0, GLOW_RADIUS)
    .fill({ color: 0xffffff, alpha: 1 })
    .circle(0, 0, GLOW_RADIUS * 0.68)
    .fill({ color: 0xffffff, alpha: 1 })
    .circle(0, 0, GLOW_RADIUS * 0.42)
    .fill({ color: 0xffffff, alpha: 1 })
    .circle(0, 0, CORE_RADIUS)
    .fill({ color: 0xffffff, alpha: 1 })

  const texture = app.renderer.generateTexture({
    target: glowGraphic,
    resolution: 2,
    antialias: true,
  })

  glowGraphic.destroy()

  return texture
}

type UsePixiOptions = {
  sampledImage: SampledImage | null
  particlesRef: React.RefObject<ParticleData[]>
  particleColor: number
  particleSize: number
  audioStateRef?: React.RefObject<AudioReactiveState>
  step: (deltaTime?: number) => void
  setMousePosition: (x: number, y: number) => void
  clearMouse: () => void
}

export function usePixi({
  sampledImage,
  particlesRef,
  particleColor,
  particleSize,
  audioStateRef,
  step,
  setMousePosition,
  clearMouse,
}: UsePixiOptions) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const particleTextureRef = useRef<Texture | null>(null)
  const particleContainerRef = useRef<ParticleContainer<PixiParticle> | null>(null)
  const pixiParticlesRef = useRef<PixiParticle[]>([])

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    let disposed = false
    let cleanupPointerEvents = () => {}

    const init = async () => {
      const app = new Application()
      await app.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        preference: 'webgl',
      })

      if (disposed) {
        app.destroy({ removeView: true }, true)
        return
      }

      host.appendChild(app.canvas)
      appRef.current = app

      particleTextureRef.current = createParticleTexture(app)

      const syncPointer = (event: PointerEvent) => {
        const rect = app.canvas.getBoundingClientRect()
        const localX = event.clientX - rect.left - app.renderer.width / 2
        const localY = event.clientY - rect.top - app.renderer.height / 2
        setMousePosition(localX, localY)
      }

      const handlePointerMove = (event: PointerEvent) => {
        syncPointer(event)
      }

      const handlePointerLeave = () => {
        clearMouse()
      }

      app.canvas.addEventListener('pointermove', handlePointerMove)
      app.canvas.addEventListener('pointerdown', handlePointerMove)
      app.canvas.addEventListener('pointerleave', handlePointerLeave)
      cleanupPointerEvents = () => {
        app.canvas.removeEventListener('pointermove', handlePointerMove)
        app.canvas.removeEventListener('pointerdown', handlePointerMove)
        app.canvas.removeEventListener('pointerleave', handlePointerLeave)
      }

      app.ticker.add((ticker) => {
        const container = particleContainerRef.current
        const runtimeParticles = particlesRef.current
        const pixiParticles = pixiParticlesRef.current
        const treble = audioStateRef?.current?.treble ?? 0
        const treblePulse = audioStateRef?.current?.treblePulse ?? 0
        const alpha = 0.4 + treblePulse * 0.6
        const pulseScale = 1 + treblePulse * TREBLE_PULSE_SCALE_BOOST

        if (!container || runtimeParticles.length === 0 || pixiParticles.length === 0) {
          return
        }

        container.x = app.renderer.width / 2
        container.y = app.renderer.height / 2
        step(ticker.deltaTime)

        for (let index = 0; index < pixiParticles.length; index += 1) {
          const runtimeParticle = runtimeParticles[index]
          const pixiParticle = pixiParticles[index]

          if (!runtimeParticle || !pixiParticle) {
            continue
          }

          pixiParticle.x = runtimeParticle.x
          pixiParticle.y = runtimeParticle.y
          pixiParticle.alpha = alpha
          pixiParticle.scaleX = particleSize * PARTICLE_SCALE_FACTOR * pulseScale
          pixiParticle.scaleY = particleSize * PARTICLE_SCALE_FACTOR * pulseScale
          pixiParticle.tint = brightenColor(runtimeParticle.color ?? particleColor, treblePulse * 0.9 + treble * 0.2)
        }
      })
    }

    void init()

    return () => {
      disposed = true
      cleanupPointerEvents()
      pixiParticlesRef.current = []
      particleContainerRef.current?.destroy()
      particleContainerRef.current = null
      particleTextureRef.current?.destroy(true)
      particleTextureRef.current = null
      appRef.current?.destroy({ removeView: true }, true)
      appRef.current = null
    }
  }, [audioStateRef, clearMouse, particleColor, particleSize, particlesRef, setMousePosition, step])

  useEffect(() => {
    const app = appRef.current
    const texture = particleTextureRef.current

    if (!app || !texture) {
      return
    }

    particleContainerRef.current?.destroy()
    particleContainerRef.current = null
    pixiParticlesRef.current = []

    if (!sampledImage || sampledImage.particles.length === 0) {
      return
    }

    const container = new ParticleContainer<PixiParticle>({
      texture,
      dynamicProperties: {
        position: true,
        vertex: true,
        color: true,
      },
    })

    const pixiParticles = sampledImage.particles.map(
      (particle) =>
        new PixiParticle({
          texture,
          x: particle.x,
          y: particle.y,
          anchorX: 0.5,
          anchorY: 0.5,
          scaleX: particleSize * PARTICLE_SCALE_FACTOR,
          scaleY: particleSize * PARTICLE_SCALE_FACTOR,
          alpha: BASE_PARTICLE_ALPHA,
          tint: particle.color ?? particleColor,
        }),
    )

    container.addParticle(...pixiParticles)
    container.x = app.renderer.width / 2
    container.y = app.renderer.height / 2
    app.stage.addChild(container)

    particleContainerRef.current = container
    pixiParticlesRef.current = pixiParticles
  }, [particleColor, particleSize, sampledImage])

  return {
    hostRef,
  }
}
