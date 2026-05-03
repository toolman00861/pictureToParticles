export const BASS_BIN_COUNT = 10
export const TREBLE_START_INDEX = 100

export function extractBass(dataArray: ArrayLike<number>): number {
  const count = Math.min(BASS_BIN_COUNT, dataArray.length)
  if (count === 0) {
    return 0
  }

  let total = 0
  for (let index = 0; index < count; index += 1) {
    total += dataArray[index]
  }

  return total / count / 255
}

export function extractTreble(dataArray: ArrayLike<number>): number {
  const startIndex = Math.min(TREBLE_START_INDEX, Math.max(0, dataArray.length - 1))
  const count = dataArray.length - startIndex
  if (count <= 0) {
    return 0
  }

  let total = 0
  for (let index = startIndex; index < dataArray.length; index += 1) {
    total += dataArray[index]
  }

  return total / count / 255
}
