/** Deterministic PRNG so fixtures are byte-stable across builds. */
export function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x9e3779b9) >>> 0
    let t = s
    t = (t ^ (t >>> 16)) * 0x21f0aaad
    t = (t ^ (t >>> 15)) * 0x735a2d97
    t = t ^ (t >>> 15)
    return (t >>> 0) / 4294967296
  }
}

/** Stable hash of a string to a seed. */
export function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** Approximately normal noise in [-1, 1]. */
export function noise(rng: () => number) {
  return (rng() + rng() + rng() - 1.5) / 1.5
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}
