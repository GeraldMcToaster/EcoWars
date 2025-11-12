export function shuffle<T>(list: T[], seed = Date.now()): T[] {
  const copy = [...list]
  let currentIndex = copy.length
  let randomSeed = seed

  while (currentIndex !== 0) {
    randomSeed = mulberry32(randomSeed)()
    const randomIndex = Math.floor(randomSeed * currentIndex)
    currentIndex -= 1
    ;[copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex],
      copy[currentIndex],
    ]
  }

  return copy
}

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
