import { Router } from 'express'
import db from '../database.js'

const router = Router()

// GET /api/urssaf - Liste toutes les déclarations
router.get('/', (req, res) => {
  const declarations = db.prepare(`
    SELECT * FROM urssaf ORDER BY annee DESC, mois DESC
  `).all()
  res.json(declarations)
})

// GET /api/urssaf/:annee - Déclarations d'une année avec CA mensuel
router.get('/:annee', (req, res) => {
  const declarations = db.prepare(`
    SELECT * FROM urssaf WHERE annee = ? ORDER BY mois
  `).all(req.params.annee)

  // Récupérer le taux URSSAF
  const parametres = db.prepare('SELECT taux_urssaf FROM parametres WHERE id = 1').get()
  const tauxUrssaf = parametres?.taux_urssaf || 22.0

  // Créer un tableau avec les 12 mois
  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const result = moisNoms.map((nom, index) => {
    const moisNum = String(index + 1).padStart(2, '0')
    const existing = declarations.find(d => d.mois === index + 1)

    // Calculer le CA du mois à partir des factures
    const ca = db.prepare(`
      SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
      FROM factures f
      JOIN facture_lignes fl ON f.id = fl.facture_id
      WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?
    `).get(req.params.annee, moisNum)

    const caMensuel = ca?.total || 0
    const montantDuCalcule = Math.round(caMensuel * tauxUrssaf) / 100

    const base = existing || {
      id: null,
      mois: index + 1,
      annee: parseInt(req.params.annee),
      montant_verse: 0,
      montant_du_custom: null,
      statut: 'impayé',
      date_paiement: null,
      notes: null
    }

    const montantDu = base.montant_du_custom != null ? base.montant_du_custom : montantDuCalcule

    return {
      ...base,
      mois_nom: nom,
      ca_mensuel: caMensuel,
      montant_du_calcule: montantDuCalcule,
      montant_du: montantDu
    }
  })

  const totalVerse = declarations.reduce((sum, d) => sum + (d.montant_verse || 0), 0)
  const totalDu = result.reduce((sum, d) => sum + d.montant_du, 0)
  const totalCa = result.reduce((sum, d) => sum + d.ca_mensuel, 0)

  res.json({ declarations: result, total: totalVerse, total_du: totalDu, total_ca: totalCa, taux_urssaf: tauxUrssaf })
})

// POST /api/urssaf - Créer ou mettre à jour une déclaration
router.post('/', (req, res) => {
  const { mois, annee, montant_verse, montant_du_custom, statut, date_paiement, notes } = req.body

  if (!mois || !annee) {
    return res.status(400).json({ error: 'Mois et année requis' })
  }

  const customVal = montant_du_custom != null ? montant_du_custom : null

  const stmt = db.prepare(`
    INSERT INTO urssaf (mois, annee, montant_verse, montant_du_custom, statut, date_paiement, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(mois, annee) DO UPDATE SET
      montant_verse = excluded.montant_verse,
      montant_du_custom = excluded.montant_du_custom,
      statut = excluded.statut,
      date_paiement = excluded.date_paiement,
      notes = excluded.notes
  `)

  stmt.run(mois, annee, montant_verse || 0, customVal, statut || 'impayé', date_paiement, notes)

  const declaration = db.prepare(`
    SELECT * FROM urssaf WHERE mois = ? AND annee = ?
  `).get(mois, annee)

  res.status(201).json(declaration)
})

// PUT /api/urssaf/:id
router.put('/:id', (req, res) => {
  const { montant_verse, statut, date_paiement, notes } = req.body

  const stmt = db.prepare(`
    UPDATE urssaf SET montant_verse = ?, statut = ?, date_paiement = ?, notes = ?
    WHERE id = ?
  `)

  stmt.run(montant_verse, statut, date_paiement, notes, req.params.id)

  const declaration = db.prepare('SELECT * FROM urssaf WHERE id = ?').get(req.params.id)
  res.json(declaration)
})

export default router
