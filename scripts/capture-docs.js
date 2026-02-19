#!/usr/bin/env node
/**
 * capture-docs.js
 * Captures screenshots of each app page for the /aide documentation page.
 * Usage: npm run capture-docs
 *
 * Starts the Vite dev server, captures all pages at 1280x800, then cleans up.
 */

const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const BASE_URL = 'http://localhost:5173'
const DOCS_DIR = path.join(__dirname, '..', 'frontend', 'public', 'docs')

const PAGES = [
  { route: '/',            file: 'dashboard.png',    label: 'Dashboard' },
  { route: '/clients',     file: 'clients.png',      label: 'Clients' },
  { route: '/prestations', file: 'prestations.png',  label: 'Prestations' },
  { route: '/devis',       file: 'devis.png',        label: 'Devis' },
  { route: '/factures',    file: 'factures.png',     label: 'Factures' },
  { route: '/urssaf',      file: 'urssaf.png',       label: 'URSSAF' },
  { route: '/tva',         file: 'tva.png',          label: 'TVA' },
  { route: '/parametres',  file: 'parametres.png',   label: 'Paramètres' },
]

async function waitForServer(url, maxMs = 30000) {
  const http = require('http')
  const start = Date.now()
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        resolve()
      }).on('error', () => {
        if (Date.now() - start > maxMs) {
          reject(new Error(`Server at ${url} did not start within ${maxMs}ms`))
        } else {
          setTimeout(check, 500)
        }
      })
    }
    check()
  })
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(DOCS_DIR, { recursive: true })

  // Check if Vite is already running
  let viteProcess = null
  let serverAlreadyRunning = false

  try {
    await waitForServer(BASE_URL, 1000)
    serverAlreadyRunning = true
    console.log('ℹ  Vite dev server already running on port 5173')
  } catch {
    console.log('▶  Starting Vite dev server...')
    viteProcess = spawn('npm', ['run', 'dev:frontend'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore',
      detached: false,
    })

    console.log('⏳  Waiting for Vite to be ready...')
    await waitForServer(BASE_URL, 30000)
    console.log('✓  Vite ready')
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
  })
  const page = await context.newPage()

  // Suppress console errors from the page
  page.on('console', () => {})

  console.log(`\n📸  Capturing ${PAGES.length} pages...\n`)

  for (const { route, file, label } of PAGES) {
    try {
      // Set up API interception BEFORE navigating to /parametres
      if (route === '/parametres') {
        await page.route(/\/api\/parametres$/, r => {
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              nom_entreprise: 'Mon Entreprise',
              prenom: 'Jean',
              nom: 'Dupont',
              adresse: '123 rue de la Paix',
              code_postal: '75001',
              ville: 'Paris',
              siret: '123 456 789 00012',
              email: 'contact@entreprise.fr',
              telephone: '06 12 34 56 78',
              iban: 'FR76 1234 5678 9012 3456 7890 123',
              taux_urssaf: 22.0,
              seuil_ca: 77700,
              tva_active: false,
              taux_tva: 20.0,
              seuil_tva: 37500,
              tva_date_debut: '',
            }),
          })
        })
      }

      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 10000 })
      await page.waitForTimeout(1200)

      if (route === '/parametres') {
        await page.unroute(/\/api\/parametres$/)
      }

      const outPath = path.join(DOCS_DIR, file)
      await page.screenshot({ path: outPath, fullPage: false })
      console.log(`  ✓  ${label.padEnd(16)} → frontend/public/docs/${file}`)
    } catch (err) {
      console.error(`  ✗  ${label.padEnd(16)} → failed: ${err.message}`)
    }
  }

  await browser.close()

  if (viteProcess && !serverAlreadyRunning) {
    viteProcess.kill()
    console.log('\n▪  Vite dev server stopped')
  }

  console.log(`\n✅  Done! Screenshots saved to frontend/public/docs/\n`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
