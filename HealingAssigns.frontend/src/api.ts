const API_URL = import.meta.env.VITE_API_URL

export interface WeatherForecast {
  id: number
  date: string
  temperatureC: number
  temperatureF: number
  summary: string
  createdAt: string
}

export async function getForecasts(): Promise<WeatherForecast[]> {
  const res = await fetch(`${API_URL}/weatherforecast`)
  if (!res.ok) throw new Error(`GET failed: ${res.status}`)
  return res.json()
}

export async function createForecast(): Promise<WeatherForecast> {
  const res = await fetch(`${API_URL}/weatherforecast`, { method: 'POST' })
  if (!res.ok) throw new Error(`POST failed: ${res.status}`)
  return res.json()
}
