import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getForecasts, createForecast } from './api'

function App() {
  const queryClient = useQueryClient()

  const { data: forecasts, isLoading, error } = useQuery({
    queryKey: ['forecasts'],
    queryFn: getForecasts,
  })

  const addForecast = useMutation({
    mutationFn: createForecast,
    onSuccess: (newForecast) => {
      queryClient.setQueryData(['forecasts'], (old: typeof forecasts) =>
        old ? [newForecast, ...old] : [newForecast]
      )
    },
  })

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Weather Forecasts</h1>
          <button
            className="btn btn-primary"
            onClick={() => addForecast.mutate()}
            disabled={addForecast.isPending}
          >
            {addForecast.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              'Generate Forecast'
            )}
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center p-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            Failed to load forecasts: {error.message}
          </div>
        )}

        {forecasts && forecasts.length === 0 && (
          <p className="text-base-content/50 text-center py-12">
            No forecasts yet. Generate one!
          </p>
        )}

        <div className="flex flex-col gap-3">
          {forecasts?.map((f) => (
            <div key={f.id} className="card bg-base-200 shadow">
              <div className="card-body p-4 flex-row items-center justify-between">
                <div>
                  <span className="font-bold text-lg">{f.temperatureC}°C</span>
                  <span className="text-base-content/50 ml-2">({f.temperatureF}°F)</span>
                  <span className="badge badge-ghost ml-3">{f.summary}</span>
                </div>
                <div className="text-sm text-base-content/50">
                  {new Date(f.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
