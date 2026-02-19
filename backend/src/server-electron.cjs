// Version du serveur pour Electron (production)
const express = require('express')
const cors = require('cors')
const path = require('path')
const Database = require('better-sqlite3')

const app = express()
const PORT = process.env.PORT || 3001

// Chemin de la base de données dans le dossier userData de l'app
const userDataPath = process.env.ELECTRON_USER_DATA || path.join(__dirname, '../../data')
const dbPath = path.join(userDataPath, 'facturation.db')

console.log('Base de données:', dbPath)

// Initialiser la base de données
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Créer les tables
db.exec(`
  CREATE TABLE IF NOT EXISTS parametres (
    id INTEGER PRIMARY KEY DEFAULT 1,
    nom_entreprise TEXT,
    prenom TEXT,
    nom TEXT,
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    siret TEXT,
    email TEXT,
    telephone TEXT,
    iban TEXT,
    taux_urssaf REAL DEFAULT 22.0
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT,
    telephone TEXT,
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    siret TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    prix_unitaire REAL NOT NULL,
    unite TEXT DEFAULT 'unité'
  );

  CREATE TABLE IF NOT EXISTS devis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    date_creation DATE DEFAULT CURRENT_DATE,
    date_validite DATE,
    statut TEXT DEFAULT 'brouillon',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devis_lignes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devis_id INTEGER REFERENCES devis(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantite REAL DEFAULT 1,
    prix_unitaire REAL NOT NULL,
    ordre INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    devis_id INTEGER REFERENCES devis(id),
    date_emission DATE DEFAULT CURRENT_DATE,
    date_paiement DATE,
    statut TEXT DEFAULT 'payée',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS facture_lignes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facture_id INTEGER REFERENCES factures(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantite REAL DEFAULT 1,
    prix_unitaire REAL NOT NULL,
    ordre INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS urssaf (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    montant_verse REAL DEFAULT 0,
    statut TEXT DEFAULT 'impayé',
    date_paiement DATE,
    notes TEXT,
    UNIQUE(mois, annee)
  );

  INSERT OR IGNORE INTO parametres (id) VALUES (1);
`)

// Migration : ajouter montant_du_custom si absent
try {
  db.prepare("SELECT montant_du_custom FROM urssaf LIMIT 1").get()
} catch (e) {
  db.exec("ALTER TABLE urssaf ADD COLUMN montant_du_custom REAL DEFAULT NULL")
}

// Middleware
app.use(cors())
app.use(express.json())

// Servir le frontend
app.use(express.static(path.join(__dirname, '../../frontend/dist')))

// === ROUTES API ===

// Paramètres
app.get('/api/parametres', (req, res) => {
  const params = db.prepare('SELECT * FROM parametres WHERE id = 1').get()
  res.json(params || {})
})

app.put('/api/parametres', (req, res) => {
  const { nom_entreprise, prenom, nom, adresse, code_postal, ville, siret, email, telephone, iban, taux_urssaf } = req.body
  db.prepare(`
    UPDATE parametres SET nom_entreprise = ?, prenom = ?, nom = ?, adresse = ?,
    code_postal = ?, ville = ?, siret = ?, email = ?, telephone = ?, iban = ?, taux_urssaf = ?
    WHERE id = 1
  `).run(nom_entreprise, prenom, nom, adresse, code_postal, ville, siret, email, telephone, iban, taux_urssaf || 22.0)
  res.json(db.prepare('SELECT * FROM parametres WHERE id = 1').get())
})

// Clients
app.get('/api/clients', (req, res) => {
  res.json(db.prepare('SELECT * FROM clients ORDER BY nom').all())
})

app.get('/api/clients/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id)
  if (!client) return res.status(404).json({ error: 'Client non trouvé' })
  res.json(client)
})

app.post('/api/clients', (req, res) => {
  const { nom, email, telephone, adresse, code_postal, ville, siret, notes } = req.body
  if (!nom) return res.status(400).json({ error: 'Le nom est requis' })
  const result = db.prepare('INSERT INTO clients (nom, email, telephone, adresse, code_postal, ville, siret, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(nom, email, telephone, adresse, code_postal, ville, siret, notes)
  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid))
})

app.put('/api/clients/:id', (req, res) => {
  const { nom, email, telephone, adresse, code_postal, ville, siret, notes } = req.body
  db.prepare('UPDATE clients SET nom = ?, email = ?, telephone = ?, adresse = ?, code_postal = ?, ville = ?, siret = ?, notes = ? WHERE id = ?').run(nom, email, telephone, adresse, code_postal, ville, siret, notes, req.params.id)
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id))
})

app.delete('/api/clients/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// Prestations
app.get('/api/prestations', (req, res) => {
  res.json(db.prepare('SELECT * FROM prestations ORDER BY nom').all())
})

app.post('/api/prestations', (req, res) => {
  const { nom, description, prix_unitaire, unite } = req.body
  if (!nom || prix_unitaire === undefined) return res.status(400).json({ error: 'Nom et prix requis' })
  const result = db.prepare('INSERT INTO prestations (nom, description, prix_unitaire, unite) VALUES (?, ?, ?, ?)').run(nom, description, prix_unitaire, unite || 'unité')
  res.status(201).json(db.prepare('SELECT * FROM prestations WHERE id = ?').get(result.lastInsertRowid))
})

app.put('/api/prestations/:id', (req, res) => {
  const { nom, description, prix_unitaire, unite } = req.body
  db.prepare('UPDATE prestations SET nom = ?, description = ?, prix_unitaire = ?, unite = ? WHERE id = ?').run(nom, description, prix_unitaire, unite, req.params.id)
  res.json(db.prepare('SELECT * FROM prestations WHERE id = ?').get(req.params.id))
})

app.delete('/api/prestations/:id', (req, res) => {
  db.prepare('DELETE FROM prestations WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// Dashboard
app.get('/api/dashboard/stats', (req, res) => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const caAnnuel = db.prepare(`SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ?`).get(String(currentYear))
  const caMensuel = db.prepare(`SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?`).get(String(currentYear), String(currentMonth).padStart(2, '0'))
  const nbFactures = db.prepare(`SELECT COUNT(*) as count FROM factures WHERE strftime('%Y', date_emission) = ?`).get(String(currentYear))
  const parametres = db.prepare('SELECT taux_urssaf FROM parametres WHERE id = 1').get()
  const tauxUrssaf = parametres?.taux_urssaf || 22.0
  const caAnnuelVal = caAnnuel.total
  let urssafDu = 0
  for (let mi = 1; mi <= 12; mi++) {
    const moisNum = String(mi).padStart(2, '0')
    const caMois = db.prepare("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?").get(String(currentYear), moisNum)
    const montantDuCalcule = Math.round(((caMois?.total || 0) * tauxUrssaf)) / 100
    const custom = db.prepare('SELECT montant_du_custom FROM urssaf WHERE mois = ? AND annee = ?').get(mi, currentYear)
    urssafDu += (custom?.montant_du_custom != null) ? custom.montant_du_custom : montantDuCalcule
  }
  const totalUrssaf = db.prepare(`SELECT COALESCE(SUM(montant_verse), 0) as total FROM urssaf WHERE annee = ? AND statut = 'payé'`).get(currentYear)
  const dernieresFactures = db.prepare(`SELECT f.*, c.nom as client_nom, (SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id) as total FROM factures f LEFT JOIN clients c ON f.client_id = c.id ORDER BY f.created_at DESC LIMIT 5`).all()

  res.json({
    ca_annuel: caAnnuelVal,
    ca_mensuel: caMensuel.total,
    nb_factures: nbFactures.count,
    total_urssaf: totalUrssaf.total,
    urssaf_du: urssafDu,
    montant_net: caAnnuelVal - urssafDu,
    taux_urssaf: tauxUrssaf,
    dernieres_factures: dernieresFactures
  })
})

app.get('/api/dashboard/ca-mensuel/:annee', (req, res) => {
  const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const data = moisNoms.map((nom, index) => {
    const mois = String(index + 1).padStart(2, '0')
    const ca = db.prepare(`SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?`).get(req.params.annee, mois)
    return { mois: nom, ca: ca.total }
  })
  res.json(data)
})

app.get('/api/dashboard/ca-chart', (req, res) => {
  const { mode = 'mois', annee, date } = req.query
  const parametres = db.prepare('SELECT taux_urssaf FROM parametres WHERE id = 1').get()
  const tauxUrssaf = parametres?.taux_urssaf || 22.0

  function getUrssafMois(m, y) {
    const moisNum = String(m).padStart(2, '0')
    const caMois = db.prepare("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?").get(String(y), moisNum)
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
      const d = new Date(monday); d.setDate(monday.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const ca = db.prepare("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE f.date_emission = ?").get(dateStr)
      const caVal = ca.total
      const urssaf = Math.round(caVal * tauxUrssaf) / 100
      return { label: `${nom} ${d.getDate()}/${d.getMonth() + 1}`, ca: caVal, urssaf, net: caVal - urssaf }
    })
    const debut = monday.toISOString().split('T')[0]
    const fin = new Date(monday); fin.setDate(monday.getDate() + 6)
    return res.json({ data, periode: `${debut} au ${fin.toISOString().split('T')[0]}` })
  }
  if (mode === 'annee') {
    const rows = db.prepare("SELECT strftime('%Y', f.date_emission) as an, COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id GROUP BY an ORDER BY an").all()
    const currentYear = String(new Date().getFullYear())
    if (!rows.find(r => r.an === currentYear)) rows.push({ an: currentYear, total: 0 })
    const data = rows.map(r => {
      let urssafTotal = 0
      for (let m = 1; m <= 12; m++) urssafTotal += getUrssafMois(m, r.an)
      return { label: r.an, ca: r.total, urssaf: urssafTotal, net: r.total - urssafTotal }
    })
    return res.json({ data, periode: 'Toutes les années' })
  }
  const y = annee || String(new Date().getFullYear())
  const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const data = moisNoms.map((nom, index) => {
    const mois = String(index + 1).padStart(2, '0')
    const ca = db.prepare("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?").get(y, mois)
    const urssaf = getUrssafMois(index + 1, y)
    return { label: nom, ca: ca.total, urssaf, net: ca.total - urssaf }
  })
  res.json({ data, periode: y })
})

// URSSAF
app.get('/api/urssaf/:annee', (req, res) => {
  const declarations = db.prepare('SELECT * FROM urssaf WHERE annee = ? ORDER BY mois').all(req.params.annee)
  const parametres = db.prepare('SELECT taux_urssaf FROM parametres WHERE id = 1').get()
  const tauxUrssaf = parametres?.taux_urssaf || 22.0
  const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const result = moisNoms.map((nom, index) => {
    const moisNum = String(index + 1).padStart(2, '0')
    const existing = declarations.find(d => d.mois === index + 1)
    const ca = db.prepare("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?").get(req.params.annee, moisNum)
    const caMensuel = ca?.total || 0
    const montantDuCalcule = Math.round(caMensuel * tauxUrssaf) / 100
    const base = existing ? { ...existing, mois_nom: nom } : { id: null, mois: index + 1, mois_nom: nom, annee: parseInt(req.params.annee), montant_verse: 0, montant_du_custom: null, statut: 'impayé', date_paiement: null, notes: null }
    const montantDu = base.montant_du_custom != null ? base.montant_du_custom : montantDuCalcule
    return { ...base, ca_mensuel: caMensuel, montant_du_calcule: montantDuCalcule, montant_du: montantDu }
  })
  const totalVerse = declarations.reduce((s, d) => s + (d.montant_verse || 0), 0)
  const totalDu = result.reduce((s, d) => s + d.montant_du, 0)
  const totalCa = result.reduce((s, d) => s + d.ca_mensuel, 0)
  res.json({ declarations: result, total: totalVerse, total_du: totalDu, total_ca: totalCa, taux_urssaf: tauxUrssaf })
})

app.post('/api/urssaf', (req, res) => {
  const { mois, annee, montant_verse, montant_du_custom, statut, date_paiement, notes } = req.body
  if (!mois || !annee) return res.status(400).json({ error: 'Mois et année requis' })
  const customVal = montant_du_custom != null ? montant_du_custom : null
  db.prepare('INSERT INTO urssaf (mois, annee, montant_verse, montant_du_custom, statut, date_paiement, notes) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(mois, annee) DO UPDATE SET montant_verse = excluded.montant_verse, montant_du_custom = excluded.montant_du_custom, statut = excluded.statut, date_paiement = excluded.date_paiement, notes = excluded.notes').run(mois, annee, montant_verse || 0, customVal, statut || 'impayé', date_paiement, notes)
  res.status(201).json(db.prepare('SELECT * FROM urssaf WHERE mois = ? AND annee = ?').get(mois, annee))
})

// Devis
app.get('/api/devis', (req, res) => {
  res.json(db.prepare(`SELECT d.*, c.nom as client_nom, (SELECT SUM(quantite * prix_unitaire) FROM devis_lignes WHERE devis_id = d.id) as total FROM devis d LEFT JOIN clients c ON d.client_id = c.id ORDER BY d.created_at DESC`).all())
})

app.get('/api/devis/:id', (req, res) => {
  const devis = db.prepare('SELECT d.*, c.nom as client_nom FROM devis d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?').get(req.params.id)
  if (!devis) return res.status(404).json({ error: 'Devis non trouvé' })
  devis.lignes = db.prepare('SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre').all(req.params.id)
  res.json(devis)
})

app.post('/api/devis', (req, res) => {
  const { client_id, date_validite, notes, lignes } = req.body
  const year = new Date().getFullYear()
  const last = db.prepare(`SELECT numero FROM devis WHERE numero LIKE 'D-${year}-%' ORDER BY id DESC LIMIT 1`).get()
  let nextNum = 1
  if (last) { const m = last.numero.match(/D-\d{4}-(\d+)/); if (m) nextNum = parseInt(m[1]) + 1 }
  const numero = `D-${year}-${String(nextNum).padStart(3, '0')}`

  const result = db.prepare('INSERT INTO devis (numero, client_id, date_validite, notes) VALUES (?, ?, ?, ?)').run(numero, client_id, date_validite, notes)
  const devisId = result.lastInsertRowid
  if (lignes?.length > 0) {
    const stmt = db.prepare('INSERT INTO devis_lignes (devis_id, description, quantite, prix_unitaire, ordre) VALUES (?, ?, ?, ?, ?)')
    lignes.forEach((l, i) => stmt.run(devisId, l.description, l.quantite, l.prix_unitaire, i))
  }
  res.status(201).json(db.prepare('SELECT * FROM devis WHERE id = ?').get(devisId))
})

app.put('/api/devis/:id', (req, res) => {
  const { client_id, date_validite, statut, notes, lignes } = req.body
  db.prepare('UPDATE devis SET client_id = ?, date_validite = ?, statut = ?, notes = ? WHERE id = ?').run(client_id, date_validite, statut, notes, req.params.id)
  if (lignes) {
    db.prepare('DELETE FROM devis_lignes WHERE devis_id = ?').run(req.params.id)
    const stmt = db.prepare('INSERT INTO devis_lignes (devis_id, description, quantite, prix_unitaire, ordre) VALUES (?, ?, ?, ?, ?)')
    lignes.forEach((l, i) => stmt.run(req.params.id, l.description, l.quantite, l.prix_unitaire, i))
  }
  res.json(db.prepare('SELECT * FROM devis WHERE id = ?').get(req.params.id))
})

app.delete('/api/devis/:id', (req, res) => {
  db.prepare('DELETE FROM devis WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

app.post('/api/devis/:id/convertir', (req, res) => {
  const devis = db.prepare('SELECT * FROM devis WHERE id = ?').get(req.params.id)
  if (!devis) return res.status(404).json({ error: 'Devis non trouvé' })
  const lignes = db.prepare('SELECT * FROM devis_lignes WHERE devis_id = ?').all(req.params.id)

  const year = new Date().getFullYear()
  const last = db.prepare(`SELECT numero FROM factures WHERE numero LIKE 'F-${year}-%' ORDER BY id DESC LIMIT 1`).get()
  let nextNum = 1
  if (last) { const m = last.numero.match(/F-\d{4}-(\d+)/); if (m) nextNum = parseInt(m[1]) + 1 }
  const numero = `F-${year}-${String(nextNum).padStart(3, '0')}`

  const result = db.prepare('INSERT INTO factures (numero, client_id, devis_id, notes) VALUES (?, ?, ?, ?)').run(numero, devis.client_id, devis.id, devis.notes)
  const factureId = result.lastInsertRowid
  const stmt = db.prepare('INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre) VALUES (?, ?, ?, ?, ?)')
  lignes.forEach((l, i) => stmt.run(factureId, l.description, l.quantite, l.prix_unitaire, i))
  db.prepare("UPDATE devis SET statut = 'accepté' WHERE id = ?").run(req.params.id)

  res.status(201).json(db.prepare('SELECT * FROM factures WHERE id = ?').get(factureId))
})

// Factures
app.get('/api/factures', (req, res) => {
  res.json(db.prepare(`SELECT f.*, c.nom as client_nom, (SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id) as total FROM factures f LEFT JOIN clients c ON f.client_id = c.id ORDER BY f.created_at DESC`).all())
})

app.get('/api/factures/:id', (req, res) => {
  const facture = db.prepare('SELECT f.*, c.nom as client_nom, c.email as client_email, c.adresse as client_adresse, c.code_postal as client_code_postal, c.ville as client_ville, c.siret as client_siret FROM factures f LEFT JOIN clients c ON f.client_id = c.id WHERE f.id = ?').get(req.params.id)
  if (!facture) return res.status(404).json({ error: 'Facture non trouvée' })
  facture.lignes = db.prepare('SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre').all(req.params.id)
  res.json(facture)
})

app.post('/api/factures', (req, res) => {
  try {
    const { client_id, date_emission, date_paiement, notes, lignes } = req.body
    const parsedClientId = client_id ? parseInt(client_id) : null
    const year = new Date().getFullYear()
    const last = db.prepare(`SELECT numero FROM factures WHERE numero LIKE 'F-${year}-%' ORDER BY id DESC LIMIT 1`).get()
    let nextNum = 1
    if (last) { const m = last.numero.match(/F-\d{4}-(\d+)/); if (m) nextNum = parseInt(m[1]) + 1 }
    const numero = `F-${year}-${String(nextNum).padStart(3, '0')}`

    const result = db.prepare('INSERT INTO factures (numero, client_id, date_emission, date_paiement, notes) VALUES (?, ?, ?, ?, ?)').run(numero, parsedClientId, date_emission, date_paiement, notes)
    const factureId = result.lastInsertRowid
    if (lignes?.length > 0) {
      const stmt = db.prepare('INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre) VALUES (?, ?, ?, ?, ?)')
      lignes.forEach((l, i) => stmt.run(factureId, l.description || '', parseFloat(l.quantite) || 0, parseFloat(l.prix_unitaire) || 0, i))
    }
    res.status(201).json(db.prepare('SELECT * FROM factures WHERE id = ?').get(factureId))
  } catch (error) {
    console.error('Erreur création facture:', error)
    res.status(500).json({ error: 'Erreur création facture' })
  }
})

app.put('/api/factures/:id', (req, res) => {
  try {
    const { client_id, date_emission, date_paiement, statut, notes, lignes } = req.body
    const parsedClientId = client_id ? parseInt(client_id) : null
    db.prepare('UPDATE factures SET client_id = ?, date_emission = ?, date_paiement = ?, statut = ?, notes = ? WHERE id = ?').run(parsedClientId, date_emission, date_paiement, statut, notes, req.params.id)
    if (lignes) {
      db.prepare('DELETE FROM facture_lignes WHERE facture_id = ?').run(req.params.id)
      const stmt = db.prepare('INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre) VALUES (?, ?, ?, ?, ?)')
      lignes.forEach((l, i) => stmt.run(req.params.id, l.description || '', parseFloat(l.quantite) || 0, parseFloat(l.prix_unitaire) || 0, i))
    }
    res.json(db.prepare('SELECT * FROM factures WHERE id = ?').get(req.params.id))
  } catch (error) {
    console.error('Erreur mise à jour facture:', error)
    res.status(500).json({ error: 'Erreur mise à jour facture' })
  }
})

app.delete('/api/factures/:id', (req, res) => {
  db.prepare('DELETE FROM factures WHERE id = ?').run(req.params.id)
  res.status(204).send()
})

// PDF routes
const PDFDocument = require('pdfkit')

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0).replace(/\u202F|\u00A0/g, ' ')
}

app.get('/api/factures/:id/pdf', (req, res) => {
  const facture = db.prepare('SELECT f.*, c.nom as client_nom, c.adresse as client_adresse, c.code_postal as client_code_postal, c.ville as client_ville, c.siret as client_siret FROM factures f LEFT JOIN clients c ON f.client_id = c.id WHERE f.id = ?').get(req.params.id)
  if (!facture) return res.status(404).json({ error: 'Facture non trouvée' })

  const lignes = db.prepare('SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre').all(req.params.id)
  const parametres = db.prepare('SELECT * FROM parametres WHERE id = 1').get()

  const doc = new PDFDocument({ margin: 50 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${facture.numero}.pdf"`)
  doc.pipe(res)

  // En-tête
  doc.fontSize(20).font('Helvetica-Bold').text(parametres?.nom_entreprise || 'Mon Entreprise', 50, 50)
  doc.fontSize(10).font('Helvetica')
  let y = 75
  if (parametres?.prenom && parametres?.nom) { doc.text(`${parametres.prenom} ${parametres.nom}`, 50, y); y += 15 }
  if (parametres?.adresse) { doc.text(parametres.adresse, 50, y); y += 15 }
  if (parametres?.code_postal || parametres?.ville) { doc.text(`${parametres.code_postal || ''} ${parametres.ville || ''}`.trim(), 50, y); y += 15 }
  if (parametres?.siret) { doc.text(`SIRET: ${parametres.siret}`, 50, y); y += 15 }
  if (parametres?.email) { doc.text(`Email: ${parametres.email}`, 50, y) }

  doc.fontSize(24).font('Helvetica-Bold').text('FACTURE', 400, 50, { align: 'right' })
  doc.fontSize(12).font('Helvetica')
  doc.text(`N° ${facture.numero}`, 400, 80, { align: 'right' })
  doc.text(`Date: ${formatDate(facture.date_emission)}`, 400, 95, { align: 'right' })
  if (facture.date_paiement) doc.text(`Payée le: ${formatDate(facture.date_paiement)}`, 400, 110, { align: 'right' })

  // Client
  doc.fontSize(12).font('Helvetica-Bold').text('Facturé à:', 350, 160)
  doc.fontSize(11).font('Helvetica')
  y = 175
  if (facture.client_nom) { doc.text(facture.client_nom, 350, y); y += 15 }
  if (facture.client_adresse) { doc.text(facture.client_adresse, 350, y); y += 15 }
  if (facture.client_code_postal || facture.client_ville) { doc.text(`${facture.client_code_postal || ''} ${facture.client_ville || ''}`.trim(), 350, y) }

  // Tableau
  const tableTop = 270
  doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill()
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
  doc.text('Description', 50, tableTop + 8, { width: 280 })
  doc.text('Qté', 330, tableTop + 8, { width: 60, align: 'right' })
  doc.text('Prix unit.', 390, tableTop + 8, { width: 80, align: 'right' })
  doc.text('Total', 470, tableTop + 8, { width: 80, align: 'right' })

  let rowY = tableTop + 30
  let total = 0
  doc.font('Helvetica').fontSize(10)
  lignes.forEach((ligne, i) => {
    const lineTotal = ligne.quantite * ligne.prix_unitaire
    total += lineTotal
    if (i % 2 === 1) { doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 20).fill() }
    doc.fillColor('#000000')
    doc.text(ligne.description, 50, rowY, { width: 280 })
    doc.text(String(ligne.quantite), 330, rowY, { width: 60, align: 'right' })
    doc.text(formatMoney(ligne.prix_unitaire), 390, rowY, { width: 80, align: 'right' })
    doc.text(formatMoney(lineTotal), 470, rowY, { width: 80, align: 'right' })
    rowY += 20
  })

  rowY += 10
  doc.moveTo(50, rowY).lineTo(550, rowY).stroke()
  rowY += 15
  doc.font('Helvetica-Bold').fontSize(12)
  doc.text('TOTAL HT', 390, rowY, { width: 80, align: 'right' })
  doc.text(formatMoney(total), 470, rowY, { width: 80, align: 'right' })

  rowY += 30
  doc.font('Helvetica').fontSize(9).fillColor('#666666')
  doc.text('TVA non applicable, art. 293 B du CGI', 50, rowY)

  if (parametres?.iban) {
    rowY += 30
    doc.fillColor('#000000').fontSize(10).text(`Coordonnées bancaires: ${parametres.iban}`, 50, rowY)
  }

  doc.end()
})

app.get('/api/devis/:id/pdf', (req, res) => {
  const devis = db.prepare('SELECT d.*, c.nom as client_nom, c.adresse as client_adresse, c.code_postal as client_code_postal, c.ville as client_ville, c.siret as client_siret FROM devis d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?').get(req.params.id)
  if (!devis) return res.status(404).json({ error: 'Devis non trouvé' })

  const lignes = db.prepare('SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre').all(req.params.id)
  const parametres = db.prepare('SELECT * FROM parametres WHERE id = 1').get()

  const doc = new PDFDocument({ margin: 50 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${devis.numero}.pdf"`)
  doc.pipe(res)

  doc.fontSize(20).font('Helvetica-Bold').text(parametres?.nom_entreprise || 'Mon Entreprise', 50, 50)
  doc.fontSize(10).font('Helvetica')
  let y = 75
  if (parametres?.prenom && parametres?.nom) { doc.text(`${parametres.prenom} ${parametres.nom}`, 50, y); y += 15 }
  if (parametres?.adresse) { doc.text(parametres.adresse, 50, y); y += 15 }
  if (parametres?.code_postal || parametres?.ville) { doc.text(`${parametres.code_postal || ''} ${parametres.ville || ''}`.trim(), 50, y); y += 15 }
  if (parametres?.siret) { doc.text(`SIRET: ${parametres.siret}`, 50, y) }

  doc.fontSize(24).font('Helvetica-Bold').text('DEVIS', 400, 50, { align: 'right' })
  doc.fontSize(12).font('Helvetica')
  doc.text(`N° ${devis.numero}`, 400, 80, { align: 'right' })
  doc.text(`Date: ${formatDate(devis.date_creation)}`, 400, 95, { align: 'right' })
  if (devis.date_validite) doc.text(`Valide jusqu'au: ${formatDate(devis.date_validite)}`, 400, 110, { align: 'right' })

  doc.fontSize(12).font('Helvetica-Bold').text('Client:', 350, 160)
  doc.fontSize(11).font('Helvetica')
  y = 175
  if (devis.client_nom) { doc.text(devis.client_nom, 350, y); y += 15 }
  if (devis.client_adresse) { doc.text(devis.client_adresse, 350, y); y += 15 }
  if (devis.client_code_postal || devis.client_ville) { doc.text(`${devis.client_code_postal || ''} ${devis.client_ville || ''}`.trim(), 350, y) }

  const tableTop = 270
  doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill()
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
  doc.text('Description', 50, tableTop + 8, { width: 280 })
  doc.text('Qté', 330, tableTop + 8, { width: 60, align: 'right' })
  doc.text('Prix unit.', 390, tableTop + 8, { width: 80, align: 'right' })
  doc.text('Total', 470, tableTop + 8, { width: 80, align: 'right' })

  let rowY = tableTop + 30
  let total = 0
  doc.font('Helvetica').fontSize(10)
  lignes.forEach((ligne, i) => {
    const lineTotal = ligne.quantite * ligne.prix_unitaire
    total += lineTotal
    if (i % 2 === 1) { doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 20).fill() }
    doc.fillColor('#000000')
    doc.text(ligne.description, 50, rowY, { width: 280 })
    doc.text(String(ligne.quantite), 330, rowY, { width: 60, align: 'right' })
    doc.text(formatMoney(ligne.prix_unitaire), 390, rowY, { width: 80, align: 'right' })
    doc.text(formatMoney(lineTotal), 470, rowY, { width: 80, align: 'right' })
    rowY += 20
  })

  rowY += 10
  doc.moveTo(50, rowY).lineTo(550, rowY).stroke()
  rowY += 15
  doc.font('Helvetica-Bold').fontSize(12)
  doc.text('TOTAL HT', 390, rowY, { width: 80, align: 'right' })
  doc.text(formatMoney(total), 470, rowY, { width: 80, align: 'right' })

  rowY += 30
  doc.font('Helvetica').fontSize(9).fillColor('#666666')
  doc.text('TVA non applicable, art. 293 B du CGI', 50, rowY)

  rowY += 40
  doc.fontSize(10).fillColor('#000000').text('Bon pour accord - Date et signature du client:', 50, rowY)
  doc.rect(50, rowY + 20, 200, 60).stroke()

  doc.end()
})

// Fallback pour SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'))
})

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})

module.exports = app
