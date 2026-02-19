import { Router } from 'express'
import db from '../database.js'

const router = Router()

// Générer un numéro de facture
function generateNumeroFacture() {
  const year = new Date().getFullYear()
  const lastFacture = db.prepare(`
    SELECT numero FROM factures
    WHERE numero LIKE 'F-${year}-%'
    ORDER BY id DESC LIMIT 1
  `).get()

  let nextNum = 1
  if (lastFacture) {
    const match = lastFacture.numero.match(/F-\d{4}-(\d+)/)
    if (match) nextNum = parseInt(match[1]) + 1
  }

  return `F-${year}-${String(nextNum).padStart(3, '0')}`
}

// GET /api/factures
router.get('/', (req, res) => {
  const factures = db.prepare(`
    SELECT f.*, c.nom as client_nom,
      (SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id) as total
    FROM factures f
    LEFT JOIN clients c ON f.client_id = c.id
    ORDER BY f.created_at DESC
  `).all()
  res.json(factures)
})

// GET /api/factures/export-csv?annee=YYYY
router.get('/export-csv', (req, res) => {
  const annee = req.query.annee || String(new Date().getFullYear())

  const factures = db.prepare(`
    SELECT f.numero, f.date_emission, c.nom as client_nom,
      COALESCE((SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id), 0) as total,
      f.statut
    FROM factures f
    LEFT JOIN clients c ON f.client_id = c.id
    WHERE strftime('%Y', f.date_emission) = ?
    ORDER BY f.date_emission ASC
  `).all(annee)

  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`

  const header = ['Numéro', 'Date', 'Client', 'Montant HT (€)', 'Statut'].map(escape).join(',')
  const rows = factures.map(f => [
    f.numero,
    f.date_emission,
    f.client_nom || '',
    f.total.toFixed(2),
    f.statut
  ].map(escape).join(','))

  const csv = '\uFEFF' + [header, ...rows].join('\r\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="factures-${annee}.csv"`)
  res.send(csv)
})

// GET /api/factures/:id
router.get('/:id', (req, res) => {
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

  res.json({ ...facture, lignes })
})

// POST /api/factures
router.post('/', (req, res) => {
  try {
    const { client_id, date_emission, date_paiement, notes, lignes } = req.body
    const numero = generateNumeroFacture()
    const parsedClientId = client_id ? parseInt(client_id) : null

    const insertFacture = db.prepare(`
      INSERT INTO factures (numero, client_id, date_emission, date_paiement, notes)
      VALUES (?, ?, ?, ?, ?)
    `)

    const insertLigne = db.prepare(`
      INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre)
      VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      const result = insertFacture.run(numero, parsedClientId, date_emission, date_paiement, notes)
      const factureId = result.lastInsertRowid

      if (lignes && lignes.length > 0) {
        lignes.forEach((ligne, index) => {
          insertLigne.run(
            factureId,
            ligne.description || '',
            parseFloat(ligne.quantite) || 0,
            parseFloat(ligne.prix_unitaire) || 0,
            index
          )
        })
      }

      return factureId
    })

    const factureId = transaction()
    const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(factureId)
    res.status(201).json(facture)
  } catch (error) {
    console.error('Erreur création facture:', error)
    res.status(500).json({ error: 'Erreur création facture' })
  }
})

// PUT /api/factures/:id
router.put('/:id', (req, res) => {
  try {
    const { client_id, date_emission, date_paiement, statut, notes, lignes } = req.body
    const parsedClientId = client_id ? parseInt(client_id) : null

    const updateFacture = db.prepare(`
      UPDATE factures SET client_id = ?, date_emission = ?, date_paiement = ?, statut = ?, notes = ?
      WHERE id = ?
    `)

    const deleteLignes = db.prepare('DELETE FROM facture_lignes WHERE facture_id = ?')
    const insertLigne = db.prepare(`
      INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre)
      VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      updateFacture.run(parsedClientId, date_emission, date_paiement, statut, notes, req.params.id)

      if (lignes) {
        deleteLignes.run(req.params.id)
        lignes.forEach((ligne, index) => {
          insertLigne.run(
            req.params.id,
            ligne.description || '',
            parseFloat(ligne.quantite) || 0,
            parseFloat(ligne.prix_unitaire) || 0,
            index
          )
        })
      }
    })

    transaction()
    const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(req.params.id)
    res.json(facture)
  } catch (error) {
    console.error('Erreur mise à jour facture:', error)
    res.status(500).json({ error: 'Erreur mise à jour facture' })
  }
})

// DELETE /api/factures/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM factures WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
