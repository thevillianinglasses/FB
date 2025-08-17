import React from 'react'
import { createRoot } from 'react-dom/client'

function SimpleApp() {
  return (
    <div>
      <h1>Hello World - React Test</h1>
      <p>If you can see this, React is working!</p>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<SimpleApp />)