import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 Main.jsx is loading...')
console.log('React version:', React.version)
console.log('Root element:', document.getElementById('root'))

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('❌ Root element not found!')
  } else {
    console.log('✅ Root element found, creating React root...')
    const root = createRoot(rootElement)
    console.log('✅ React root created, rendering App...')
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
    console.log('✅ App rendered successfully!')
  }
} catch (error) {
  console.error('❌ Error in main.jsx:', error)
}
