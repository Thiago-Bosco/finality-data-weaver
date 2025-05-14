
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for the DOM element before rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element. Make sure there is an element with id 'root' in your HTML.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
