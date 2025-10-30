import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// En desarrollo, activo MSW para simular APIs sin tocar el backend real
if (import.meta.env.MODE === 'development') {
  import('./mocks/browser').then(({ worker }) => worker.start());
}

// Renderizo la aplicación raíz con StrictMode y mi componente App
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
