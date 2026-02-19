import { Router } from 'express'
import db from '../database.js'

const router = Router()

// Générer un numéro de devis
function generateNumeroDevis() {
  const year = new Date().getFullYear()
  const lastDevis = db.prepare(`
    SELECT numero FROM devis
    WHERE numero LIKE 'D-${year}-%'
    ORDER BY id DESC LIMIT 1
  `).get()

  let nextNum = 1
  if (lastDevis) {
    const match = lastDevis.numero.match(/D-\d{4}-(\d+)/)
    if (match) nextNum = parseInt(match[1]) + 1
  }

  return `D-${year}-${String(nextNum).padStart(3, '0')}`
}

// GET /api/devis
router.get('/', (req, res) => {
  const devis = db.prepare(`
    SELECT d.*, c.nom as client_nom,
      (SELECT SUM(quantite * prix_unitaire) FROM devis_lignes WHERE devis_id = d.id) as total
    FROM devis d
    LEFT JOIN clients c ON d.client_id = c.id
    ORDER BY d.created_at DESC
  `).all()
  res.json(devis)
})

// GET /api/devis/:id
router.get('/:id', (req, res) => {
  const devis = db.prepare(`
    SELECT d.*, c.nom as client_nom
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

  res.json({ ...devis, lignes })
})

// POST /api/devis
router.post('/', (req, res) => {
  const { client_id, date_validite, notes, lignes } = req.body
  const numero = generateNumeroDevis()

  const insertDevis = db.prepare(`
    INSERT INTO devis (numero, client_id, date_validite, notes)
    VALUES (?, ?, ?, ?)
  `)

  const insertLigne = db.prepare(`
    INSERT INTO devis_lignes (devis_id, description, quantite, prix_unitaire, ordre)
    VALUES (?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    const result = insertDevis.run(numero, client_id, date_validite, notes)
    const devisId = result.lastInsertRowid

    if (lignes && lignes.length > 0) {
      lignes.forEach((ligne, index) => {
        insertLigne.run(devisId, ligne.description, ligne.quantite, ligne.prix_unitaire, index)
      })
    }

    return devisId
  })

  const devisId = transaction()
  const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(devisId)
  res.status(201).json(devis)
})

// PUT /api/devis/:id
router.put('/:id', (req, res) => {
  const { client_id, date_validite, statut, notes, lignes } = req.body

  const updateDevis = db.prepare(`
    UPDATE devis SET client_id = ?, date_validite = ?, statut = ?, notes = ?
    WHERE id = ?
  `)

  const deleteLignes = db.prepare('DELETE FROM devis_lignes WHERE devis_id = ?')
  const insertLigne = db.prepare(`
    INSERT INTO devis_lignes (devis_id, description, quantite, prix_unitaire, ordre)
    VALUES (?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction(() => {
    updateDevis.run(client_id, date_validite, statut, notes, req.params.id)

    if (lignes) {
      deleteLignes.run(req.params.id)
      lignes.forEach((ligne, index) => {
        insertLigne.run(req.params.id, ligne.description, ligne.quantite, ligne.prix_unitaire, index)
      })
    }
  })

  transaction()
  const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(req.params.id)
  res.json(devis)
})

// DELETE /api/devis/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM devis WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// POST /api/devis/:id/convertir - Convertir en facture
router.post('/:id/convertir', (req, res) => {
  const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(req.params.id)
  if (!devis) {
    return res.status(404).json({ error: 'Devis non trouvé' })
  }

  const lignes = db.prepare('SELECT * FROM devis_lignes WHERE devis_id = ?').all(req.params.id)

  // Générer numéro facture
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
  const numeroFacture = `F-${year}-${String(nextNum).padStart(3, '0')}`

  const insertFacture = db.prepare(`
    INSERT INTO factures (numero, client_id, devis_id, notes)
    VALUES (?, ?, ?, ?)
  `)

  const insertLigne = db.prepare(`
    INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre)
    VALUES (?, ?, ?, ?, ?)
  `)

  const updateDevis = db.prepare(`UPDATE devis SET statut = 'accepté' WHERE id = ?`)

  const transaction = db.transaction(() => {
    const result = insertFacture.run(numeroFacture, devis.client_id, devis.id, devis.notes)
    const factureId = result.lastInsertRowid

    lignes.forEach((ligne, index) => {
      insertLigne.run(factureId, ligne.description, ligne.quantite, ligne.prix_unitaire, index)
    })

    updateDevis.run(req.params.id)

    return factureId
  })

  const factureId = transaction()
  const facture = db.prepare('SELECT * FROM factures WHERE id = ?').get(factureId)
  res.status(201).json(facture)
})

export default router
