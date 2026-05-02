import { useEffect, useRef } from 'react'
import {
  Application,
  Graphics,
  Particle as PixiParticle,
  ParticleContainer,
  type Texture,
} from 'pixi.js'
import type { ParticleData, SampledImage } from './types'

type UsePixiOptions = {
  sampledImage: SampledImage | null
  particlesRef: React.RefObject<ParticleData[]>
  particleColor: number
  particleSize: number
  step: (deltaTime?: number) => void
  setMousePosition: (x: number, y: number) => void
  clearMouse: () => void
}

export function usePixi({
  sampledImage,
  particlesRef,
  particleColor,
  particleSize,
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

      const pointerGraphic = new Graphics().circle(1, 1, 1).fill({ color: 0xffffff })
      particleTextureRef.current = app.renderer.generateTexture(pointerGraphic)
      pointerGraphic.destroy()

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
  }, [clearMouse, particlesRef, setMousePosition, step])

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
          scaleX: particleSize,
          scaleY: particleSize,
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
