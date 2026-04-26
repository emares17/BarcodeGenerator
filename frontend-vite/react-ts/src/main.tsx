import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'

posthog.init('phc_of66gtPFx6ymHiDUF4BaNbYav4TTdTFHSx7sYFgcDCed', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>,
)
