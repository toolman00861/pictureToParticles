export type ParticleData = {
  x: number
  y: number
  originX: number
  originY: number
  vx: number
  vy: number
  color: number
}

export type AudioReactiveState = {
  bass: number
  treble: number
  bassPulse: number
  treblePulse: number
}

export type SampledImage = {
  width: number
  height: number
  particles: ParticleData[]
}

export type ParticleEffectProps = {
  imageSrc: string
  gap?: number
  imageScale?: number
  mouseRadius?: number
  stiffness?: number
  damping?: number
  jitterStrength?: number
  bassJitterGain?: number
  particleSize?: number
  particleColor?: number
  alphaThreshold?: number
  repelStrength?: number
  audioStateRef?: React.RefObject<AudioReactiveState>
  className?: string
}
