import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Import routes
import parametresRoutes from './routes/parametres.js'
import clientsRoutes from './routes/clients.js'
import prestationsRoutes from './routes/prestations.js'
import devisRoutes from './routes/devis.js'
import facturesRoutes from './routes/factures.js'
import urssafRoutes from './routes/urssaf.js'
import dashboardRoutes from './routes/dashboard.js'
import { generateFacturePDF, generateDevisPDF } from './services/pdf.js'
import db from './database.js'

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes API
app.use('/api/parametres', parametresRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/prestations', prestationsRoutes)
app.use('/api/devis', devisRoutes)
app.use('/api/factures', facturesRoutes)
app.use('/api/urssaf', urssafRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Routes PDF
app.get('/api/factures/:id/pdf', async (req, res) => {
  try {
    const facture = db.prepare(`
      SELECT f.*, c.nom as client_nom, c.email as client_email,
        c.adresse as client_adresse, c.code_postal as client_code_postal,
        c.ville as client_ville, c.siret as client_siret
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      WHERE f.id = ?
    `).get(req.params.id)

    if (!facture) {
      return res.status(404).json({ error: 'Facture non trouvée' })
    }

    const lignes = db.prepare(`
      SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre
    `).all(req.params.id)

    const parametres = db.prepare('SELECT * FROM parametres WHERE id = 1').get()

    const pdfBuffer = await generateFacturePDF({ ...facture, lignes }, parametres)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${facture.numero}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    res.status(500).json({ error: 'Erreur génération PDF' })
  }
})

app.get('/api/devis/:id/pdf', async (req, res) => {
  try {
    const devis = db.prepare(`
      SELECT d.*, c.nom as client_nom, c.email as client_email,
        c.adresse as client_adresse, c.code_postal as client_code_postal,
        c.ville as client_ville, c.siret as client_siret
      FROM devis d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?
    `).get(req.params.id)

    if (!devis) {
      return res.status(404).json({ error: 'Devis non trouvé' })
    }

    const lignes = db.prepare(`
      SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre
    `).all(req.params.id)

    const parametres = db.prepare('SELECT * FROM parametres WHERE id = 1').get()

    const pdfBuffer = await generateDevisPDF({ ...devis, lignes }, parametres)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${devis.numero}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Erreur génération PDF:', error)
    res.status(500).json({ error: 'Erreur génération PDF' })
  }
})

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`)
})
