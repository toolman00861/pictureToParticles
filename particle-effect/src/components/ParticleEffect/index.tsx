import { useMemo } from 'react'
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

  const particleCount = particles.sampledImage?.particles.length ?? 0
  const infoText = useMemo(() => {
    if (particles.status === 'loading') {
      return '正在采样图片像素并生成粒子...'
    }

    if (particles.status === 'error') {
      return particles.error ?? '粒子初始化失败。'
    }

    return `粒子数量 ${particleCount.toLocaleString()}  鼠标靠近时会推开粒子，移开后缓慢回归。`
  }, [particleCount, particles.error, particles.status])

  return (
    <section className={className ? `particle-effect ${className}` : 'particle-effect'}>
      <div className="particle-copy">
        <p className="eyebrow">PixiJS Particle Sea</p>
        <h1>图片打散为粒子海</h1>
        <p className="description">
          透明区域会被忽略，只保留主体像素。当前实现基于 Canvas 采样 + Pixi 粒子渲染，适合继续调参扩展。
        </p>
        <p className="meta">{infoText}</p>
      </div>
      <div ref={hostRef} className="particle-stage" aria-label="交互粒子画布" />
    </section>
  )
}

export default ParticleEffect
