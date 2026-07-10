function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function readableColor(hex: string | null | undefined): string | undefined {
  if (!hex) return undefined
  if (luminance(hex) > 0.75) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgb(${Math.round(r * 0.55)}, ${Math.round(g * 0.55)}, ${Math.round(b * 0.55)})`
  }
  return hex
}

export function isLightColor(hex: string | null | undefined): boolean {
  if (!hex) return false
  return luminance(hex) > 0.75
}
