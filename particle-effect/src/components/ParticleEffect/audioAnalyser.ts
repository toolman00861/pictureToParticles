export const BASS_BIN_COUNT = 10
export const MID_START_INDEX = 10
export const MID_END_INDEX = 100
export const TREBLE_START_INDEX = 100

function extractAverageRange(dataArray: ArrayLike<number>, startIndex: number, endIndex: number) {
  const start = Math.max(0, Math.min(startIndex, dataArray.length))
  const end = Math.max(start, Math.min(endIndex, dataArray.length))
  const count = end - start
  if (count <= 0) {
    return 0
  }

  let total = 0
  for (let index = start; index < end; index += 1) {
    total += dataArray[index]
  }

  return total / count / 255
}

export function extractBass(dataArray: ArrayLike<number>): number {
  return extractAverageRange(dataArray, 0, BASS_BIN_COUNT)
}

export function extractMid(dataArray: ArrayLike<number>): number {
  return extractAverageRange(dataArray, MID_START_INDEX, MID_END_INDEX)
}

export function extractTreble(dataArray: ArrayLike<number>): number {
  return extractAverageRange(dataArray, TREBLE_START_INDEX, dataArray.length)
}
