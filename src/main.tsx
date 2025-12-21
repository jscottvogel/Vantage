import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Amplify } from 'aws-amplify';
import './index.css'
import App from './App.tsx'

// Try to load Amplify config, fail gracefully if not found (for dev without AWS)
// Try to load Amplify config, fail gracefully if not found (for dev without AWS)
// Try to load Amplify config, fail gracefully if not found (for dev without AWS)
try {
  // @ts-ignore - Validating existence
  const outputs = await import('../amplify_outputs.json');
  Amplify.configure(outputs.default || outputs);
} catch (e) {
  console.warn("Amplify config not found. Auth features will not work until amplify_outputs.json is present in the root.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
