import type { SampledImage } from './types'

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
  alphaThreshold: number
  targetWidth: number
  targetHeight: number
}

export async function sampleImageParticles({
  imageSrc,
  gap,
  alphaThreshold,
  targetWidth,
  targetHeight,
}: SampleImageOptions): Promise<SampledImage> {
  const image = await loadImage(imageSrc)
  const safeWidth = Math.max(1, Math.floor(targetWidth))
  const safeHeight = Math.max(1, Math.floor(targetHeight))
  const scale = Math.max(
    0.1,
    Math.min(safeWidth / image.naturalWidth, safeHeight / image.naturalHeight, 1.8),
  )
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
  const particles: SampledImage['particles'] = []
  const halfWidth = drawWidth / 2
  const halfHeight = drawHeight / 2

  for (let y = 0; y < drawHeight; y += gap) {
    for (let x = 0; x < drawWidth; x += gap) {
      const index = (y * drawWidth + x) * 4
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
      })
    }
  }

  return {
    width: drawWidth,
    height: drawHeight,
    particles,
  }
}
