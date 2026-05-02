import type { SampledImage } from './types'

const MAX_IMAGE_SCALE = 2.6

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src
  })

type SampleImageOptions = {
  imageSrc: string
  gap: number
  imageScale: number
  alphaThreshold: number
  targetWidth: number
  targetHeight: number
}

export async function sampleImageParticles({
  imageSrc,
  gap,
  imageScale,
  alphaThreshold,
  targetWidth,
  targetHeight,
}: SampleImageOptions): Promise<SampledImage> {
  const image = await loadImage(imageSrc)
  const safeWidth = Math.max(1, Math.floor(targetWidth))
  const safeHeight = Math.max(1, Math.floor(targetHeight))
  const fitScale = Math.min(safeWidth / image.naturalWidth, safeHeight / image.naturalHeight)
  const scale = Math.max(0.1, Math.min(fitScale * imageScale, MAX_IMAGE_SCALE))
  const drawWidth = Math.max(1, Math.floor(image.naturalWidth * scale))
  const drawHeight = Math.max(1, Math.floor(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = drawWidth
  canvas.height = drawHeight

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Canvas 2D is not available for image sampling.')
  }

  context.clearRect(0, 0, drawWidth, drawHeight)
  context.drawImage(image, 0, 0, drawWidth, drawHeight)

  const { data } = context.getImageData(0, 0, drawWidth, drawHeight)
  const halfWidth = drawWidth / 2
  const halfHeight = drawHeight / 2

  const collectParticles = (step: number) => {
    const particles: SampledImage['particles'] = []

    for (let y = 0; y < drawHeight; y += step) {
      for (let x = 0; x < drawWidth; x += step) {
        const index = (y * drawWidth + x) * 4
        const red = data[index]
        const green = data[index + 1]
        const blue = data[index + 2]
        const alpha = data[index + 3]

        if (alpha <= alphaThreshold) {
          continue
        }

        const originX = x - halfWidth
        const originY = y - halfHeight

        particles.push({
          x: originX,
          y: originY,
          originX,
          originY,
          vx: 0,
          vy: 0,
          color: (red << 16) | (green << 8) | blue,
        })
      }
    }

    return particles
  }

  const primaryStep = Math.max(1, Math.round(gap))
  let particles = collectParticles(primaryStep)

  // Very small scales combined with a large gap can skip all opaque pixels.
  // Retry with denser sampling before giving up so the image does not vanish.
  if (particles.length === 0 && primaryStep > 1) {
    particles = collectParticles(Math.max(1, Math.floor(primaryStep / 2)))
  }

  if (particles.length === 0 && primaryStep > 1) {
    particles = collectParticles(1)
  }

  return {
    width: drawWidth,
    height: drawHeight,
    particles,
  }
}
