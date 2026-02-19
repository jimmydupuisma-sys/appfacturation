import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkMode'
import { ThemeProvider } from './contexts/Theme'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DarkModeProvider>
          <App />
        </DarkModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
