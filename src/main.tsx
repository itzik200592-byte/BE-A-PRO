import React from 'react';
import { createRoot } from 'react-dom/client';
import './ui/tokens.css';
import { App } from './ui/App.tsx';
import { wireInstall, registerWorker } from './ui/install.ts';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Chrome fires its install event early and only once, so the listener has to be
// in place before anything renders. The worker is what makes it fire at all.
wireInstall();
registerWorker(import.meta.env.BASE_URL);
