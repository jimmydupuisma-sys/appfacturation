import { Router } from 'express'
import db from '../database.js'

const router = Router()

// GET /api/parametres
router.get('/', (req, res) => {
  const params = db.prepare('SELECT * FROM parametres WHERE id = 1').get()
  res.json(params || {})
})

// PUT /api/parametres
router.put('/', (req, res) => {
  const {
    nom_entreprise, prenom, nom, adresse, code_postal,
    ville, siret, email, telephone, iban, taux_urssaf, seuil_ca
  } = req.body

  const stmt = db.prepare(`
    UPDATE parametres SET
      nom_entreprise = ?, prenom = ?, nom = ?, adresse = ?,
      code_postal = ?, ville = ?, siret = ?, email = ?,
      telephone = ?, iban = ?, taux_urssaf = ?, seuil_ca = ?
    WHERE id = 1
  `)

  stmt.run(
    nom_entreprise, prenom, nom, adresse, code_postal,
    ville, siret, email, telephone, iban, taux_urssaf || 22.0, seuil_ca ?? 77700
  )

  const updated = db.prepare('SELECT * FROM parametres WHERE id = 1').get()
  res.json(updated)
})

export default router
