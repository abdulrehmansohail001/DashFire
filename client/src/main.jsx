import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MascotProvider } from './context/MascotContext'
import MascotBird from './components/mascot/MascotBird'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MascotProvider>
      <App />
      <MascotBird />
    </MascotProvider>
  </StrictMode>,
)
