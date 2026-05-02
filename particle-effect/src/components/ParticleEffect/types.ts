export type ParticleData = {
  x: number
  y: number
  originX: number
  originY: number
  vx: number
  vy: number
}

export type SampledImage = {
  width: number
  height: number
  particles: ParticleData[]
}

export type ParticleEffectProps = {
  imageSrc: string
  gap?: number
  mouseRadius?: number
  stiffness?: number
  damping?: number
  particleSize?: number
  particleColor?: number
  alphaThreshold?: number
  repelStrength?: number
  className?: string
}
