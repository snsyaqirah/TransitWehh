import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/lib/theme'
import { Layout } from '@/components/layout/Layout'
import { Overview } from '@/pages/Overview'
import { Trends } from '@/pages/Trends'
import { Compare } from '@/pages/Compare'
import { KtmbDeepDive } from '@/pages/KtmbDeepDive'
import { Insights } from '@/pages/Insights'
import { Predictions } from '@/pages/Predictions'
import { Explorer } from '@/pages/Explorer'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { NotFound } from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Overview />} />
              <Route path="trends" element={<Trends />} />
              <Route path="compare" element={<Compare />} />
              <Route path="ktmb" element={<KtmbDeepDive />} />
              <Route path="insights" element={<Insights />} />
              <Route path="predict" element={<Predictions />} />
              <Route path="explorer" element={<Explorer />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
