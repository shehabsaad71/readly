/* ========================================
   FREE PDF TTS READER
   by Analyst Sandeep
   
   React Entry Point
   Mounts the App component to the DOM.
   ======================================== */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure index.html has a div with id="root".');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);