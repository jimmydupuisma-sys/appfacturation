import { Router } from 'express'
import db from '../database.js'

const router = Router()

// GET /api/prestations
router.get('/', (req, res) => {
  const prestations = db.prepare('SELECT * FROM prestations ORDER BY nom').all()
  res.json(prestations)
})

// GET /api/prestations/:id
router.get('/:id', (req, res) => {
  const prestation = db.prepare('SELECT * FROM prestations WHERE id = ?').get(req.params.id)
  if (!prestation) {
    return res.status(404).json({ error: 'Prestation non trouvée' })
  }
  res.json(prestation)
})

// POST /api/prestations
router.post('/', (req, res) => {
  const { nom, description, prix_unitaire, unite } = req.body

  if (!nom || prix_unitaire === undefined) {
    return res.status(400).json({ error: 'Nom et prix unitaire requis' })
  }

  const stmt = db.prepare(`
    INSERT INTO prestations (nom, description, prix_unitaire, unite)
    VALUES (?, ?, ?, ?)
  `)

  const result = stmt.run(nom, description, prix_unitaire, unite || 'unité')
  const prestation = db.prepare('SELECT * FROM prestations WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(prestation)
})

// PUT /api/prestations/:id
router.put('/:id', (req, res) => {
  const { nom, description, prix_unitaire, unite } = req.body

  const stmt = db.prepare(`
    UPDATE prestations SET nom = ?, description = ?, prix_unitaire = ?, unite = ?
    WHERE id = ?
  `)

  stmt.run(nom, description, prix_unitaire, unite, req.params.id)
  const prestation = db.prepare('SELECT * FROM prestations WHERE id = ?').get(req.params.id)
  res.json(prestation)
})

// DELETE /api/prestations/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM prestations WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
