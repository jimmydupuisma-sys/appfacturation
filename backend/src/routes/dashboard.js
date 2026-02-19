import { Router } from 'express'
import db from '../database.js'

const router = Router()

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // CA annuel (toutes les factures de l'année)
  const caAnnuel = db.prepare(`
    SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
    FROM factures f
    JOIN facture_lignes fl ON f.id = fl.facture_id
    WHERE strftime('%Y', f.date_emission) = ?
  `).get(String(currentYear))

  // CA du mois en cours
  const caMensuel = db.prepare(`
    SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
    FROM factures f
    JOIN facture_lignes fl ON f.id = fl.facture_id
    WHERE strftime('%Y', f.date_emission) = ?
    AND strftime('%m', f.date_emission) = ?
  `).get(String(currentYear), String(currentMonth).padStart(2, '0'))

  // Nombre de factures
  const nbFactures = db.prepare(`
    SELECT COUNT(*) as count FROM factures
    WHERE strftime('%Y', date_emission) = ?
  `).get(String(currentYear))

  // Nombre de clients
  const nbClients = db.prepare('SELECT COUNT(*) as count FROM clients').get()

  // Taux URSSAF + seuil CA
  const parametres = db.prepare('SELECT taux_urssaf, seuil_ca FROM parametres WHERE id = 1').get()
  const tauxUrssaf = parametres?.taux_urssaf || 22.0
  const seuilCa = parametres?.seuil_ca ?? 77700

  // URSSAF dû (calculé mois par mois, avec prise en compte des montants custom)
  let urssafDu = 0
  for (let m = 1; m <= 12; m++) {
    const moisNum = String(m).padStart(2, '0')
    const caMois = db.prepare(`
      SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
      FROM factures f
      JOIN facture_lignes fl ON f.id = fl.facture_id
      WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?
    `).get(String(currentYear), moisNum)
    const montantDuCalcule = Math.round((caMois?.total || 0) * tauxUrssaf) / 100
    const custom = db.prepare('SELECT montant_du_custom FROM urssaf WHERE mois = ? AND annee = ?').get(m, currentYear)
    urssafDu += (custom?.montant_du_custom != null) ? custom.montant_du_custom : montantDuCalcule
  }

  // Total URSSAF versé cette année
  const totalUrssaf = db.prepare(`
    SELECT COALESCE(SUM(montant_verse), 0) as total
    FROM urssaf
    WHERE annee = ? AND statut = 'payé'
  `).get(currentYear)

  // Dernières factures
  const dernieresFactures = db.prepare(`
    SELECT f.*, c.nom as client_nom,
      (SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id) as total
    FROM factures f
    LEFT JOIN clients c ON f.client_id = c.id
    ORDER BY f.created_at DESC
    LIMIT 5
  `).all()

  res.json({
    ca_annuel: caAnnuel.total,
    ca_mensuel: caMensuel.total,
    nb_factures: nbFactures.count,
    nb_clients: nbClients.count,
    total_urssaf: totalUrssaf.total,
    urssaf_du: urssafDu,
    montant_net: caAnnuel.total - urssafDu,
    taux_urssaf: tauxUrssaf,
    seuil_ca: seuilCa,
    dernieres_factures: dernieresFactures
  })
})

// GET /api/dashboard/ca-mensuel/:annee (legacy)
router.get('/ca-mensuel/:annee', (req, res) => {
  const moisNoms = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]

  const data = moisNoms.map((nom, index) => {
    const mois = String(index + 1).padStart(2, '0')
    const ca = db.prepare(`
      SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
      FROM factures f
      JOIN facture_lignes fl ON f.id = fl.facture_id
      WHERE strftime('%Y', f.date_emission) = ?
      AND strftime('%m', f.date_emission) = ?
    `).get(req.params.annee, mois)

    return {
      mois: nom,
      ca: ca.total
    }
  })

  res.json(data)
})

// GET /api/dashboard/ca-chart?mode=mois|semaine|annee&annee=2026&date=2026-02-17
router.get('/ca-chart', (req, res) => {
  const { mode = 'mois', annee, date } = req.query
  const parametres = db.prepare('SELECT taux_urssaf FROM parametres WHERE id = 1').get()
  const tauxUrssaf = parametres?.taux_urssaf || 22.0

  function getUrssafMois(m, y) {
    const moisNum = String(m).padStart(2, '0')
    const caMois = db.prepare(`
      SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
      FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id
      WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?
    `).get(String(y), moisNum)
    const montantDuCalcule = Math.round((caMois?.total || 0) * tauxUrssaf) / 100
    const custom = db.prepare('SELECT montant_du_custom FROM urssaf WHERE mois = ? AND annee = ?').get(m, parseInt(y))
    return (custom?.montant_du_custom != null) ? custom.montant_du_custom : montantDuCalcule
  }

  if (mode === 'semaine') {
    const ref = date ? new Date(date) : new Date()
    const day = ref.getDay()
    const monday = new Date(ref)
    monday.setDate(ref.getDate() - ((day + 6) % 7))
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const data = jours.map((nom, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const ca = db.prepare(`
        SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
        FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id
        WHERE f.date_emission = ?
      `).get(dateStr)
      const caVal = ca.total
      const urssaf = Math.round(caVal * tauxUrssaf) / 100
      return { label: `${nom} ${d.getDate()}/${d.getMonth() + 1}`, ca: caVal, urssaf, net: caVal - urssaf }
    })
    const debut = monday.toISOString().split('T')[0]
    const fin = new Date(monday)
    fin.setDate(monday.getDate() + 6)
    return res.json({ data, periode: `${debut} au ${fin.toISOString().split('T')[0]}` })
  }

  if (mode === 'annee') {
    const rows = db.prepare(`
      SELECT strftime('%Y', f.date_emission) as an, COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
      FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id
      GROUP BY an ORDER BY an
    `).all()
    const currentYear = String(new Date().getFullYear())
    if (!rows.find(r => r.an === currentYear)) rows.push({ an: currentYear, total: 0 })
    const data = rows.map(r => {
      let urssafTotal = 0
      for (let m = 1; m <= 12; m++) urssafTotal += getUrssafMois(m, r.an)
      return { label: r.an, ca: r.total, urssaf: urssafTotal, net: r.total - urssafTotal }
    })
    return res.json({ data, periode: 'Toutes les années' })
  }

  // mode === 'mois' (défaut)
  const y = annee || String(new Date().getFullYear())
  const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const data = moisNoms.map((nom, index) => {
    const mois = String(index + 1).padStart(2, '0')
    const ca = db.prepare(`
      SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
      FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id
      WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?
    `).get(y, mois)
    const urssaf = getUrssafMois(index + 1, y)
    return { label: nom, ca: ca.total, urssaf, net: ca.total - urssaf }
  })
  res.json({ data, periode: y })
})

export default router
