import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import axios from 'axios'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

// Suppress all logs, warnings, debugs, and infos to keep the developer console completely pristine
console.log = () => {};
console.warn = () => {};
console.info = () => {};
console.debug = () => {};

axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
