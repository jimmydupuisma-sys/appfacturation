import { Router } from 'express'
import db from '../database.js'

const router = Router()

// GET /api/clients
router.get('/', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY nom').all()
  res.json(clients)
})

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  if (!client) {
    return res.status(404).json({ error: 'Client non trouvé' })
  }
  res.json(client)
})

// POST /api/clients
router.post('/', (req, res) => {
  const { nom, email, telephone, adresse, code_postal, ville, siret, notes } = req.body

  if (!nom) {
    return res.status(400).json({ error: 'Le nom est requis' })
  }

  const stmt = db.prepare(`
    INSERT INTO clients (nom, email, telephone, adresse, code_postal, ville, siret, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(nom, email, telephone, adresse, code_postal, ville, siret, notes)
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(client)
})

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const { nom, email, telephone, adresse, code_postal, ville, siret, notes } = req.body

  const stmt = db.prepare(`
    UPDATE clients SET
      nom = ?, email = ?, telephone = ?, adresse = ?,
      code_postal = ?, ville = ?, siret = ?, notes = ?
    WHERE id = ?
  `)

  stmt.run(nom, email, telephone, adresse, code_postal, ville, siret, notes, req.params.id)
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  res.json(client)
})

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

export default router
