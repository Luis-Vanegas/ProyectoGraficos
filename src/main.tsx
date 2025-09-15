import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Activa modo compacto sólo en pantallas pequeñas
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const applyCompact = () => {
    const isCompact = window.matchMedia('(max-width: 640px)').matches;
    document.documentElement.classList.toggle('compact', isCompact);
  };
  applyCompact();
  window.addEventListener('resize', applyCompact);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
