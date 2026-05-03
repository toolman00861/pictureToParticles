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
const HIGHLIGHT_CORE_SCALE_FACTOR = 0.7
const BASE_PARTICLE_ALPHA = 0.62
const HIGHLIGHT_CORE_SCALE_BOOST = 0.8

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

function createHighlightCoreTexture(app: Application): Texture {
  const coreGraphic = new Graphics()
    .circle(0, 0, CORE_RADIUS * 1.5)
    .fill({ color: 0xffffff, alpha: 1 })

  const texture = app.renderer.generateTexture({
    target: coreGraphic,
    resolution: 2,
    antialias: true,
  })

  coreGraphic.destroy()

  return texture
}

type UsePixiOptions = {
  sampledImage: SampledImage | null
  particlesRef: React.RefObject<ParticleData[]>
  particleColor: number
  particleSize: number
  audioStateRef?: React.RefObject<AudioReactiveState>
  highlightFlashRatio: number
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
  highlightFlashRatio,
  step,
  setMousePosition,
  clearMouse,
}: UsePixiOptions) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const particleTextureRef = useRef<Texture | null>(null)
  const highlightCoreTextureRef = useRef<Texture | null>(null)
  const particleContainerRef = useRef<ParticleContainer<PixiParticle> | null>(null)
  const highlightCoreContainerRef = useRef<ParticleContainer<PixiParticle> | null>(null)
  const pixiParticlesRef = useRef<PixiParticle[]>([])
  const highlightCoreParticlesRef = useRef<PixiParticle[]>([])
  const lastHighlightTriggerIdRef = useRef(0)
  const highlightMaskRef = useRef<Uint8Array>(new Uint8Array(0))

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
      highlightCoreTextureRef.current = createHighlightCoreTexture(app)

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
        const highlightCoreContainer = highlightCoreContainerRef.current
        const runtimeParticles = particlesRef.current
        const pixiParticles = pixiParticlesRef.current
        const highlightCoreParticles = highlightCoreParticlesRef.current
        const highlightPulse = audioStateRef?.current?.highlightPulse ?? 0
        const highlightTriggerId = audioStateRef?.current?.highlightTriggerId ?? 0

        if (
          !container ||
          !highlightCoreContainer ||
          runtimeParticles.length === 0 ||
          pixiParticles.length === 0 ||
          highlightCoreParticles.length === 0
        ) {
          return
        }

        if (highlightTriggerId !== lastHighlightTriggerIdRef.current) {
          lastHighlightTriggerIdRef.current = highlightTriggerId
          const nextMask = new Uint8Array(pixiParticles.length)
          const flashCount = Math.max(1, Math.round(pixiParticles.length * highlightFlashRatio))

          for (let picked = 0; picked < flashCount; ) {
            const randomIndex = Math.floor(Math.random() * pixiParticles.length)
            if (nextMask[randomIndex] === 0) {
              nextMask[randomIndex] = 1
              picked += 1
            }
          }

          highlightMaskRef.current = nextMask
        }

        container.x = app.renderer.width / 2
        container.y = app.renderer.height / 2
        highlightCoreContainer.x = app.renderer.width / 2
        highlightCoreContainer.y = app.renderer.height / 2
        step(ticker.deltaTime)

        for (let index = 0; index < pixiParticles.length; index += 1) {
          const runtimeParticle = runtimeParticles[index]
          const pixiParticle = pixiParticles[index]
          const highlightCoreParticle = highlightCoreParticles[index]

          if (!runtimeParticle || !pixiParticle || !highlightCoreParticle) {
            continue
          }

          const flashPulse = highlightMaskRef.current[index] ? highlightPulse : 0
          pixiParticle.x = runtimeParticle.x
          pixiParticle.y = runtimeParticle.y
          pixiParticle.alpha = BASE_PARTICLE_ALPHA
          pixiParticle.scaleX = particleSize * PARTICLE_SCALE_FACTOR
          pixiParticle.scaleY = particleSize * PARTICLE_SCALE_FACTOR
          pixiParticle.tint = runtimeParticle.color ?? particleColor

          highlightCoreParticle.x = runtimeParticle.x
          highlightCoreParticle.y = runtimeParticle.y
          highlightCoreParticle.alpha = flashPulse * 0.98
          highlightCoreParticle.scaleX =
            particleSize * HIGHLIGHT_CORE_SCALE_FACTOR * (1 + flashPulse * HIGHLIGHT_CORE_SCALE_BOOST)
          highlightCoreParticle.scaleY =
            particleSize * HIGHLIGHT_CORE_SCALE_FACTOR * (1 + flashPulse * HIGHLIGHT_CORE_SCALE_BOOST)
          highlightCoreParticle.tint = 0xffffff
        }
      })
    }

    void init()

    return () => {
      disposed = true
      cleanupPointerEvents()
      pixiParticlesRef.current = []
      highlightCoreParticlesRef.current = []
      particleContainerRef.current?.destroy()
      particleContainerRef.current = null
      highlightCoreContainerRef.current?.destroy()
      highlightCoreContainerRef.current = null
      particleTextureRef.current?.destroy(true)
      particleTextureRef.current = null
      highlightCoreTextureRef.current?.destroy(true)
      highlightCoreTextureRef.current = null
      appRef.current?.destroy({ removeView: true }, true)
      appRef.current = null
    }
  }, [
    audioStateRef,
    clearMouse,
    highlightFlashRatio,
    particleColor,
    particleSize,
    particlesRef,
    setMousePosition,
    step,
  ])

  useEffect(() => {
    const app = appRef.current
    const texture = particleTextureRef.current
    const highlightCoreTexture = highlightCoreTextureRef.current

    if (!app || !texture || !highlightCoreTexture) {
      return
    }

    particleContainerRef.current?.destroy()
    particleContainerRef.current = null
    highlightCoreContainerRef.current?.destroy()
    highlightCoreContainerRef.current = null
    pixiParticlesRef.current = []
    highlightCoreParticlesRef.current = []
    highlightMaskRef.current = new Uint8Array(0)
    lastHighlightTriggerIdRef.current = 0

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
    const highlightCoreContainer = new ParticleContainer<PixiParticle>({
      texture: highlightCoreTexture,
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
    const highlightCoreParticles = sampledImage.particles.map(
      (particle) =>
        new PixiParticle({
          texture: highlightCoreTexture,
          x: particle.x,
          y: particle.y,
          anchorX: 0.5,
          anchorY: 0.5,
          scaleX: particleSize * HIGHLIGHT_CORE_SCALE_FACTOR,
          scaleY: particleSize * HIGHLIGHT_CORE_SCALE_FACTOR,
          alpha: 0,
          tint: 0xffffff,
        }),
    )

    container.addParticle(...pixiParticles)
    highlightCoreContainer.addParticle(...highlightCoreParticles)
    container.x = app.renderer.width / 2
    container.y = app.renderer.height / 2
    highlightCoreContainer.x = app.renderer.width / 2
    highlightCoreContainer.y = app.renderer.height / 2
    app.stage.addChild(container)
    app.stage.addChild(highlightCoreContainer)

    particleContainerRef.current = container
    highlightCoreContainerRef.current = highlightCoreContainer
    pixiParticlesRef.current = pixiParticles
    highlightCoreParticlesRef.current = highlightCoreParticles
  }, [particleColor, particleSize, sampledImage])

  return {
    hostRef,
  }
}
