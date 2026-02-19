import { createContext, useContext, useState, useEffect } from 'react'

const FONTS = {
  'Inter':             'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'Poppins':           'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'DM Sans':           'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  'Nunito':            'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap',
  'Raleway':           'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap',
  'IBM Plex Sans':     'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  'Lora':              'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
  'Playfair Display':  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  'Merriweather':      'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
  'Source Serif 4':    'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;500;600;700&display=swap',
}

export const THEMES = ['sky', 'violet', 'emerald', 'rose', 'amber']
export const FONT_NAMES = Object.keys(FONTS)

const ThemeContext = createContext()

function loadFont(fontName) {
  const url = FONTS[fontName]
  if (!url) return
  const id = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`
  if (!document.getElementById(id)) {
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'sky')
  const [font, setFontState] = useState(() => localStorage.getItem('font') || 'Lora')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    loadFont(font)
    document.documentElement.style.setProperty('--font-body', `'${font}'`)
  }, [font])

  function setTheme(name) {
    setThemeState(name)
    localStorage.setItem('theme', name)
    document.documentElement.setAttribute('data-theme', name)
  }

  function setFont(name) {
    setFontState(name)
    localStorage.setItem('font', name)
    loadFont(name)
    document.documentElement.style.setProperty('--font-body', `'${name}'`)
  }

  return (
    <ThemeContext.Provider value={{ theme, font, setTheme, setFont, themes: THEMES, fonts: FONT_NAMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
