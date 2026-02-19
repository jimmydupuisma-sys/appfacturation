const { app, BrowserWindow, shell, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const initSqlJs = require('sql.js')
const PDFDocument = require('pdfkit')

// Mise à jour automatique
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour disponible',
    message: `Version ${info.version} disponible`,
    detail: 'Une nouvelle version de App Facturation est disponible. Voulez-vous la télécharger ?',
    buttons: ['Télécharger', 'Plus tard']
  }).then(result => {
    if (result.response === 0) {
      if (process.platform === 'darwin') {
        shell.openExternal('https://github.com/jimmydupuisma-sys/appfacturation/releases/latest')
      }
    }
  })
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Mise à jour prête',
    message: 'La mise à jour a été téléchargée.',
    detail: "L'application va redémarrer pour appliquer la mise à jour.",
    buttons: ['Redémarrer maintenant', 'Plus tard']
  }).then(result => {
    if (result.response === 0) autoUpdater.quitAndInstall()
  })
})

let mainWindow
let db
let logFile
const PORT = 3001
const server = express()

// Logging vers fichier pour debug
const log = (msg) => {
  const line = `${new Date().toISOString()} ${msg}\n`
  if (logFile) fs.appendFileSync(logFile, line)
  console.log(msg)
}

server.use(cors())
server.use(express.json())

async function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'facturation.db')
  console.log('Base de données:', dbPath)

  // Initialiser sql.js
  const SQL = await initSqlJs()

  // Charger ou créer la base de données
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // Créer les tables
  db.run(`
    CREATE TABLE IF NOT EXISTS parametres (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nom_entreprise TEXT, prenom TEXT, nom TEXT, adresse TEXT,
      code_postal TEXT, ville TEXT, siret TEXT, email TEXT,
      telephone TEXT, iban TEXT, taux_urssaf REAL DEFAULT 22.0
    );
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL, email TEXT, telephone TEXT, adresse TEXT,
      code_postal TEXT, ville TEXT, siret TEXT, notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS prestations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL, description TEXT, prix_unitaire REAL NOT NULL,
      unite TEXT DEFAULT 'unité'
    );
    CREATE TABLE IF NOT EXISTS devis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL, client_id INTEGER REFERENCES clients(id),
      date_creation DATE DEFAULT CURRENT_DATE, date_validite DATE,
      statut TEXT DEFAULT 'brouillon', notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS devis_lignes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      devis_id INTEGER REFERENCES devis(id) ON DELETE CASCADE,
      description TEXT NOT NULL, quantite REAL DEFAULT 1,
      prix_unitaire REAL NOT NULL, ordre INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS factures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL, client_id INTEGER REFERENCES clients(id),
      devis_id INTEGER REFERENCES devis(id),
      date_emission DATE DEFAULT CURRENT_DATE, date_paiement DATE,
      statut TEXT DEFAULT 'non payée', notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS facture_lignes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facture_id INTEGER REFERENCES factures(id) ON DELETE CASCADE,
      description TEXT NOT NULL, quantite REAL DEFAULT 1,
      prix_unitaire REAL NOT NULL, ordre INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS urssaf (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mois INTEGER NOT NULL, annee INTEGER NOT NULL,
      montant_verse REAL DEFAULT 0, statut TEXT DEFAULT 'impayé',
      date_paiement DATE, notes TEXT, UNIQUE(mois, annee)
    );
  `)

  // Insérer les paramètres par défaut
  const params = db.exec("SELECT * FROM parametres WHERE id = 1")
  if (params.length === 0 || params[0].values.length === 0) {
    db.run("INSERT OR IGNORE INTO parametres (id, taux_urssaf) VALUES (1, 22.0)")
  }

  // Migration : ajouter montant_du_custom si absent
  try {
    db.exec("SELECT montant_du_custom FROM urssaf LIMIT 1")
  } catch (e) {
    db.run("ALTER TABLE urssaf ADD COLUMN montant_du_custom REAL DEFAULT NULL")
  }

  // Migration : ajouter seuil_ca si absent
  try {
    db.exec("SELECT seuil_ca FROM parametres LIMIT 1")
  } catch (e) {
    db.run("ALTER TABLE parametres ADD COLUMN seuil_ca REAL DEFAULT 77700")
  }

  // Migration : ajouter colonnes TVA si absentes
  try {
    db.exec("SELECT tva_active FROM parametres LIMIT 1")
  } catch (e) {
    db.run("ALTER TABLE parametres ADD COLUMN tva_active INTEGER DEFAULT 0")
  }
  try {
    db.exec("SELECT taux_tva FROM parametres LIMIT 1")
  } catch (e) {
    db.run("ALTER TABLE parametres ADD COLUMN taux_tva REAL DEFAULT 20.0")
  }
  try {
    db.exec("SELECT seuil_tva FROM parametres LIMIT 1")
  } catch (e) {
    db.run("ALTER TABLE parametres ADD COLUMN seuil_tva REAL DEFAULT 37500")
  }
  try {
    db.exec("SELECT tva_date_debut FROM parametres LIMIT 1")
  } catch (e) {
    db.run("ALTER TABLE parametres ADD COLUMN tva_date_debut TEXT DEFAULT NULL")
  }

  // Table déclarations TVA
  db.run(`
    CREATE TABLE IF NOT EXISTS tva_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trimestre INTEGER NOT NULL,
      annee INTEGER NOT NULL,
      montant_verse REAL DEFAULT 0,
      statut TEXT DEFAULT 'impayé',
      date_paiement DATE,
      notes TEXT,
      UNIQUE(trimestre, annee)
    )
  `)

  saveDb()
}

function saveDb() {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'facturation.db')
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

// Helpers pour sql.js
function getOne(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function run(sql, params = []) {
  try {
    db.run(sql, params)
    const result = db.exec("SELECT last_insert_rowid()")
    const lastId = result.length > 0 ? result[0].values[0][0] : null
    saveDb()
    return { lastInsertRowid: lastId }
  } catch (err) {
    console.error('SQL Error:', err, 'Query:', sql, 'Params:', params)
    throw err
  }
}

function runInTx(sql, params = []) {
  try {
    db.run(sql, params)
    const result = db.exec("SELECT last_insert_rowid()")
    const lastId = result.length > 0 ? result[0].values[0][0] : null
    return { lastInsertRowid: lastId }
  } catch (err) {
    console.error('SQL Error:', err, 'Query:', sql, 'Params:', params)
    throw err
  }
}

function transaction(fn) {
  db.run('BEGIN TRANSACTION')
  try {
    const result = fn()
    db.run('COMMIT')
    saveDb()
    return result
  } catch (err) {
    db.run('ROLLBACK')
    throw err
  }
}

function setupRoutes() {
  const frontendPath = path.join(__dirname, '../frontend/dist')
  server.use(express.static(frontendPath))

  // Paramètres
  server.get('/api/parametres', (req, res) => {
    res.json(getOne('SELECT * FROM parametres WHERE id = 1') || {})
  })
  server.put('/api/parametres', (req, res) => {
    const { nom_entreprise, prenom, nom, adresse, code_postal, ville, siret, email, telephone, iban, taux_urssaf, seuil_ca, tva_active, taux_tva, seuil_tva, tva_date_debut } = req.body
    run('UPDATE parametres SET nom_entreprise=?, prenom=?, nom=?, adresse=?, code_postal=?, ville=?, siret=?, email=?, telephone=?, iban=?, taux_urssaf=?, seuil_ca=?, tva_active=?, taux_tva=?, seuil_tva=?, tva_date_debut=? WHERE id=1',
      [nom_entreprise, prenom, nom, adresse, code_postal, ville, siret, email, telephone, iban, taux_urssaf || 22.0, seuil_ca ?? 77700, tva_active ? 1 : 0, taux_tva ?? 20.0, seuil_tva ?? 37500, tva_date_debut || null])
    res.json(getOne('SELECT * FROM parametres WHERE id = 1'))
  })

  // Clients
  server.get('/api/clients', (req, res) => res.json(getAll('SELECT * FROM clients ORDER BY nom')))
  server.get('/api/clients/:id/historique', (req, res) => {
    const id = req.params.id
    const client = getOne('SELECT * FROM clients WHERE id = ?', [id])
    if (!client) return res.status(404).json({ error: 'Client non trouvé' })
    const y = new Date().getFullYear()
    const factures = getAll(`SELECT f.id, f.numero, f.date_emission, COALESCE((SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id), 0) as total FROM factures f WHERE f.client_id = ? ORDER BY f.date_emission DESC`, [id])
    const devis = getAll(`SELECT d.id, d.numero, d.date_creation, d.statut, COALESCE((SELECT SUM(quantite * prix_unitaire) FROM devis_lignes WHERE devis_id = d.id), 0) as total FROM devis d WHERE d.client_id = ? ORDER BY d.date_creation DESC`, [id])
    const caTotal = factures.reduce((s, f) => s + f.total, 0)
    const caAnnee = factures.filter(f => f.date_emission?.startsWith(String(y))).reduce((s, f) => s + f.total, 0)
    const caParAnneeRows = getAll(`SELECT strftime('%Y', f.date_emission) as annee, COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE f.client_id = ? GROUP BY annee ORDER BY annee`, [id])
    res.json({ client, stats: { ca_total: caTotal, ca_annee: caAnnee, nb_factures: factures.length, nb_devis: devis.length }, ca_par_annee: caParAnneeRows, factures, devis })
  })
  server.get('/api/clients/:id', (req, res) => {
    const c = getOne('SELECT * FROM clients WHERE id = ?', [req.params.id])
    c ? res.json(c) : res.status(404).json({ error: 'Non trouvé' })
  })
  server.post('/api/clients', (req, res) => {
    const { nom, email, telephone, adresse, code_postal, ville, siret, notes } = req.body
    if (!nom) return res.status(400).json({ error: 'Nom requis' })
    const r = run('INSERT INTO clients (nom, email, telephone, adresse, code_postal, ville, siret, notes) VALUES (?,?,?,?,?,?,?,?)',
      [nom, email, telephone, adresse, code_postal, ville, siret, notes])
    res.status(201).json(getOne('SELECT * FROM clients WHERE id = ?', [r.lastInsertRowid]))
  })
  server.put('/api/clients/:id', (req, res) => {
    const { nom, email, telephone, adresse, code_postal, ville, siret, notes } = req.body
    run('UPDATE clients SET nom=?, email=?, telephone=?, adresse=?, code_postal=?, ville=?, siret=?, notes=? WHERE id=?',
      [nom, email, telephone, adresse, code_postal, ville, siret, notes, req.params.id])
    res.json(getOne('SELECT * FROM clients WHERE id = ?', [req.params.id]))
  })
  server.delete('/api/clients/:id', (req, res) => { run('DELETE FROM clients WHERE id=?', [req.params.id]); res.status(204).send() })

  // Prestations
  server.get('/api/prestations', (req, res) => res.json(getAll('SELECT * FROM prestations ORDER BY nom')))
  server.post('/api/prestations', (req, res) => {
    const { nom, description, prix_unitaire, unite } = req.body
    if (!nom || prix_unitaire === undefined) return res.status(400).json({ error: 'Nom et prix requis' })
    const r = run('INSERT INTO prestations (nom, description, prix_unitaire, unite) VALUES (?,?,?,?)',
      [nom, description, prix_unitaire, unite || 'unité'])
    res.status(201).json(getOne('SELECT * FROM prestations WHERE id = ?', [r.lastInsertRowid]))
  })
  server.put('/api/prestations/:id', (req, res) => {
    const { nom, description, prix_unitaire, unite } = req.body
    run('UPDATE prestations SET nom=?, description=?, prix_unitaire=?, unite=? WHERE id=?',
      [nom, description, prix_unitaire, unite, req.params.id])
    res.json(getOne('SELECT * FROM prestations WHERE id = ?', [req.params.id]))
  })
  server.delete('/api/prestations/:id', (req, res) => { run('DELETE FROM prestations WHERE id=?', [req.params.id]); res.status(204).send() })

  // Dashboard
  server.get('/api/dashboard/stats', (req, res) => {
    const y = new Date().getFullYear(), m = new Date().getMonth() + 1
    const caAnnuel = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND f.statut = 'payée'", [String(y)])
    const caMensuel = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ? AND f.statut = 'payée'", [String(y), String(m).padStart(2, '0')])
    const nbFactures = getOne("SELECT COUNT(*) as count FROM factures WHERE strftime('%Y', date_emission) = ? AND statut = 'payée'", [String(y)])
    const parametres = getOne('SELECT taux_urssaf, seuil_ca, tva_active, taux_tva, seuil_tva, tva_date_debut FROM parametres WHERE id = 1')
    const tauxUrssaf = parametres?.taux_urssaf || 22.0
    const seuilCa = parametres?.seuil_ca ?? 77700
    const tvaActive = parametres?.tva_active === 1
    const seuilTva = parametres?.seuil_tva ?? 37500
    const caAnnuelVal = caAnnuel?.total || 0
    let urssafDu = 0
    for (let mi = 1; mi <= 12; mi++) {
      const moisNum = String(mi).padStart(2, '0')
      const caMois = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ? AND f.statut = 'payée'", [String(y), moisNum])
      const montantDuCalcule = Math.round(((caMois?.total || 0) * tauxUrssaf)) / 100
      const custom = getOne('SELECT montant_du_custom FROM urssaf WHERE mois = ? AND annee = ?', [mi, y])
      urssafDu += (custom?.montant_du_custom != null) ? custom.montant_du_custom : montantDuCalcule
    }
    const totalUrssaf = getOne("SELECT COALESCE(SUM(montant_verse), 0) as total FROM urssaf WHERE annee = ? AND statut = 'payé'", [y])
    const dernieresFactures = getAll("SELECT f.*, c.nom as client_nom, (SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id) as total FROM factures f LEFT JOIN clients c ON f.client_id = c.id ORDER BY f.created_at DESC LIMIT 5")
    const tauxTva = parametres?.taux_tva ?? 20.0
    const tvaDateDebut = parametres?.tva_date_debut || null
    let tvaCollectee = 0
    if (tvaDateDebut) {
      const caAssujettiRow = getOne(`
        SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
        FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id
        WHERE strftime('%Y', f.date_emission) = ? AND f.date_emission >= ? AND f.statut = 'payée'
      `, [String(y), tvaDateDebut])
      tvaCollectee = Math.round((caAssujettiRow?.total || 0) * tauxTva) / 100
    }
    const tvaVerseeRow = getOne(`SELECT COALESCE(SUM(montant_verse), 0) as total FROM tva_declarations WHERE annee = ?`, [y])
    const tvaVersee = tvaVerseeRow?.total || 0
    const montantNet = caAnnuelVal - urssafDu - (tvaActive ? tvaCollectee : 0)
    res.json({ ca_annuel: caAnnuelVal, ca_mensuel: caMensuel?.total || 0, nb_factures: nbFactures?.count || 0, nb_clients: getOne('SELECT COUNT(*) as count FROM clients')?.count || 0, total_urssaf: totalUrssaf?.total || 0, urssaf_du: urssafDu, montant_net: montantNet, taux_urssaf: tauxUrssaf, seuil_ca: seuilCa, tva_active: tvaActive, seuil_tva: seuilTva, taux_tva: tauxTva, tva_collectee: tvaCollectee, tva_versee: tvaVersee, tva_restante: tvaCollectee - tvaVersee, dernieres_factures: dernieresFactures })
  })
  server.get('/api/dashboard/ca-mensuel/:annee', (req, res) => {
    const noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const data = noms.map((nom, i) => {
      const ca = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ? AND f.statut = 'payée'", [req.params.annee, String(i + 1).padStart(2, '0')])
      return { mois: nom, ca: ca?.total || 0 }
    })
    res.json(data)
  })

  server.get('/api/dashboard/ca-chart', (req, res) => {
    const { mode = 'mois', annee, date } = req.query
    const parametres = getOne('SELECT taux_urssaf, tva_active, taux_tva, tva_date_debut FROM parametres WHERE id = 1')
    const tauxUrssaf = parametres?.taux_urssaf || 22.0
    const tvaActive = parametres?.tva_active === 1
    const tauxTva = parametres?.taux_tva ?? 20.0
    const tvaDateDebut = parametres?.tva_date_debut || null

    function getUrssafMois(m, y) {
      const moisNum = String(m).padStart(2, '0')
      const caMois = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ? AND f.statut = 'payée'", [String(y), moisNum])
      const montantDuCalcule = Math.round((caMois?.total || 0) * tauxUrssaf) / 100
      const custom = getOne('SELECT montant_du_custom FROM urssaf WHERE mois = ? AND annee = ?', [m, parseInt(y)])
      return (custom?.montant_du_custom != null) ? custom.montant_du_custom : montantDuCalcule
    }

    function getTvaPeriode(dateFilter) {
      if (!tvaActive || !tvaDateDebut) return 0
      const row = getOne(`SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE f.date_emission >= ? AND f.statut = 'payée' AND ${dateFilter.where}`, [tvaDateDebut, ...dateFilter.params])
      return Math.round((row?.total || 0) * tauxTva) / 100
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
        const ca = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE f.date_emission = ? AND f.statut = 'payée'", [dateStr])
        const caVal = ca?.total || 0
        const urssaf = Math.round(caVal * tauxUrssaf) / 100
        const tva = getTvaPeriode({ where: "f.date_emission = ?", params: [dateStr] })
        return { label: `${nom} ${d.getDate()}/${d.getMonth() + 1}`, ca: caVal, urssaf, tva, net: caVal - urssaf - tva }
      })
      const debut = monday.toISOString().split('T')[0]
      const fin = new Date(monday); fin.setDate(monday.getDate() + 6)
      return res.json({ data, periode: `${debut} au ${fin.toISOString().split('T')[0]}` })
    }
    if (mode === 'annee') {
      const rows = getAll("SELECT strftime('%Y', f.date_emission) as an, COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE f.statut = 'payée' GROUP BY an ORDER BY an")
      const currentYear = String(new Date().getFullYear())
      if (!rows.find(r => r.an === currentYear)) rows.push({ an: currentYear, total: 0 })
      const data = rows.map(r => {
        let urssafTotal = 0
        for (let m = 1; m <= 12; m++) urssafTotal += getUrssafMois(m, r.an)
        const tva = getTvaPeriode({ where: "strftime('%Y', f.date_emission) = ?", params: [r.an] })
        return { label: r.an, ca: r.total, urssaf: urssafTotal, tva, net: r.total - urssafTotal - tva }
      })
      return res.json({ data, periode: 'Toutes les années' })
    }
    const y = annee || String(new Date().getFullYear())
    const noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const data = noms.map((nom, i) => {
      const moisNum = String(i + 1).padStart(2, '0')
      const ca = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ? AND f.statut = 'payée'", [y, moisNum])
      const urssaf = getUrssafMois(i + 1, y)
      const tva = getTvaPeriode({ where: "strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ?", params: [y, moisNum] })
      return { label: nom, ca: ca?.total || 0, urssaf, tva, net: (ca?.total || 0) - urssaf - tva }
    })
    res.json({ data, periode: y })
  })

  // URSSAF
  server.get('/api/urssaf/:annee', (req, res) => {
    const decl = getAll('SELECT * FROM urssaf WHERE annee = ? ORDER BY mois', [req.params.annee])
    const parametres = getOne('SELECT taux_urssaf FROM parametres WHERE id = 1')
    const tauxUrssaf = parametres?.taux_urssaf || 22.0
    const noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    const result = noms.map((nom, i) => {
      const moisNum = String(i + 1).padStart(2, '0')
      const e = decl.find(d => d.mois === i + 1)
      const ca = getOne("SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id WHERE strftime('%Y', f.date_emission) = ? AND strftime('%m', f.date_emission) = ? AND f.statut = 'payée'", [req.params.annee, moisNum])
      const caMensuel = ca?.total || 0
      const montantDuCalcule = Math.round(caMensuel * tauxUrssaf) / 100
      const base = e || { id: null, mois: i + 1, annee: parseInt(req.params.annee), montant_verse: 0, montant_du_custom: null, statut: 'impayé', date_paiement: null, notes: null }
      const montantDu = base.montant_du_custom != null ? base.montant_du_custom : montantDuCalcule
      return { ...base, mois_nom: nom, ca_mensuel: caMensuel, montant_du_calcule: montantDuCalcule, montant_du: montantDu }
    })
    const totalVerse = decl.reduce((s, d) => s + (d.montant_verse || 0), 0)
    const totalDu = result.reduce((s, d) => s + d.montant_du, 0)
    const totalCa = result.reduce((s, d) => s + d.ca_mensuel, 0)
    res.json({ declarations: result, total: totalVerse, total_du: totalDu, total_ca: totalCa, taux_urssaf: tauxUrssaf })
  })
  server.post('/api/urssaf', (req, res) => {
    const { mois, annee, montant_verse, montant_du_custom, statut, date_paiement, notes } = req.body
    if (!mois || !annee) return res.status(400).json({ error: 'Mois et année requis' })
    const customVal = montant_du_custom != null ? montant_du_custom : null
    run('INSERT INTO urssaf (mois, annee, montant_verse, montant_du_custom, statut, date_paiement, notes) VALUES (?,?,?,?,?,?,?) ON CONFLICT(mois, annee) DO UPDATE SET montant_verse=excluded.montant_verse, montant_du_custom=excluded.montant_du_custom, statut=excluded.statut, date_paiement=excluded.date_paiement, notes=excluded.notes',
      [mois, annee, montant_verse || 0, customVal, statut || 'impayé', date_paiement, notes])
    res.status(201).json(getOne('SELECT * FROM urssaf WHERE mois = ? AND annee = ?', [mois, annee]))
  })

  // TVA
  server.get('/api/tva/:annee', (req, res) => {
    const annee = parseInt(req.params.annee)
    const p = getOne('SELECT taux_tva, tva_date_debut FROM parametres WHERE id = 1')
    const tauxTva = p?.taux_tva ?? 20.0
    const dateDebut = p?.tva_date_debut || null

    const trimestresMois = [[1,3],[4,6],[7,9],[10,12]]
    const noms = ['T1 (Jan–Mar)', 'T2 (Avr–Jun)', 'T3 (Jul–Sep)', 'T4 (Oct–Déc)']

    const result = trimestresMois.map((mois, i) => {
      const trimestre = i + 1
      const moisDebut = String(mois[0]).padStart(2, '0')
      const moisFin = String(mois[1]).padStart(2, '0')
      let montantCollecte = 0
      let caTotal = 0
      if (dateDebut) {
        const ca = getOne(`
          SELECT COALESCE(SUM(fl.quantite * fl.prix_unitaire), 0) as total
          FROM factures f JOIN facture_lignes fl ON f.id = fl.facture_id
          WHERE strftime('%Y', f.date_emission) = ?
          AND strftime('%m', f.date_emission) >= ? AND strftime('%m', f.date_emission) <= ?
          AND f.date_emission >= ? AND f.statut = 'payée'
        `, [String(annee), moisDebut, moisFin, dateDebut])
        caTotal = ca?.total || 0
        montantCollecte = Math.round(caTotal * tauxTva) / 100
      }
      const decl = getOne('SELECT * FROM tva_declarations WHERE trimestre = ? AND annee = ?', [trimestre, annee])
      return {
        trimestre,
        annee,
        nom: noms[i],
        montant_collecte: montantCollecte,
        ca_trimestre: caTotal,
        montant_verse: decl?.montant_verse || 0,
        statut: decl?.statut || 'impayé',
        date_paiement: decl?.date_paiement || null,
        notes: decl?.notes || null,
        id: decl?.id || null
      }
    })

    const totalCollecte = result.reduce((s, t) => s + t.montant_collecte, 0)
    const totalVerse = result.reduce((s, t) => s + t.montant_verse, 0)
    res.json({ declarations: result, total_collecte: totalCollecte, total_verse: totalVerse, taux_tva: tauxTva })
  })

  server.post('/api/tva', (req, res) => {
    const { trimestre, annee, montant_verse, statut, date_paiement, notes } = req.body
    if (!trimestre || !annee) return res.status(400).json({ error: 'Trimestre et année requis' })
    run(`INSERT INTO tva_declarations (trimestre, annee, montant_verse, statut, date_paiement, notes)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(trimestre, annee) DO UPDATE SET
           montant_verse=excluded.montant_verse, statut=excluded.statut,
           date_paiement=excluded.date_paiement, notes=excluded.notes`,
      [trimestre, annee, montant_verse || 0, statut || 'impayé', date_paiement || null, notes || null])
    res.status(201).json(getOne('SELECT * FROM tva_declarations WHERE trimestre = ? AND annee = ?', [trimestre, annee]))
  })

  // Devis
  server.get('/api/devis', (req, res) => res.json(getAll("SELECT d.*, c.nom as client_nom, (SELECT SUM(quantite * prix_unitaire) FROM devis_lignes WHERE devis_id = d.id) as total FROM devis d LEFT JOIN clients c ON d.client_id = c.id ORDER BY d.created_at DESC")))
  server.get('/api/devis/:id', (req, res) => {
    const d = getOne('SELECT d.*, c.nom as client_nom FROM devis d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?', [req.params.id])
    if (!d) return res.status(404).json({ error: 'Non trouvé' })
    d.lignes = getAll('SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre', [req.params.id])
    res.json(d)
  })
  server.post('/api/devis', (req, res) => {
    const { client_id, date_validite, notes, lignes } = req.body
    const y = new Date().getFullYear()
    const last = getOne(`SELECT numero FROM devis WHERE numero LIKE 'D-${y}-%' ORDER BY id DESC LIMIT 1`)
    let n = 1; if (last) { const m = last.numero.match(/D-\d{4}-(\d+)/); if (m) n = parseInt(m[1]) + 1 }
    const numero = `D-${y}-${String(n).padStart(3, '0')}`
    const r = transaction(() => {
      const devisResult = runInTx('INSERT INTO devis (numero, client_id, date_validite, notes) VALUES (?,?,?,?)', [numero, client_id, date_validite, notes])
      if (lignes?.length > 0) { lignes.forEach((l, i) => runInTx('INSERT INTO devis_lignes (devis_id, description, quantite, prix_unitaire, ordre) VALUES (?,?,?,?,?)', [devisResult.lastInsertRowid, l.description, l.quantite, l.prix_unitaire, i])) }
      return devisResult
    })
    res.status(201).json(getOne('SELECT * FROM devis WHERE id = ?', [r.lastInsertRowid]))
  })
  server.put('/api/devis/:id', (req, res) => {
    const { client_id, date_validite, statut, notes, lignes } = req.body
    transaction(() => {
      runInTx('UPDATE devis SET client_id=?, date_validite=?, statut=?, notes=? WHERE id=?', [client_id, date_validite, statut, notes, req.params.id])
      if (lignes) { runInTx('DELETE FROM devis_lignes WHERE devis_id=?', [req.params.id]); lignes.forEach((l, i) => runInTx('INSERT INTO devis_lignes (devis_id, description, quantite, prix_unitaire, ordre) VALUES (?,?,?,?,?)', [req.params.id, l.description, l.quantite, l.prix_unitaire, i])) }
    })
    res.json(getOne('SELECT * FROM devis WHERE id = ?', [req.params.id]))
  })
  server.delete('/api/devis/:id', (req, res) => {
    transaction(() => { runInTx('DELETE FROM devis_lignes WHERE devis_id=?', [req.params.id]); runInTx('DELETE FROM devis WHERE id=?', [req.params.id]) })
    res.status(204).send()
  })
  server.post('/api/devis/:id/convertir', (req, res) => {
    const d = getOne('SELECT * FROM devis WHERE id = ?', [req.params.id])
    if (!d) return res.status(404).json({ error: 'Non trouvé' })
    const lignes = getAll('SELECT * FROM devis_lignes WHERE devis_id = ?', [req.params.id])
    const y = new Date().getFullYear()
    const last = getOne(`SELECT numero FROM factures WHERE numero LIKE 'F-${y}-%' ORDER BY id DESC LIMIT 1`)
    let n = 1; if (last) { const m = last.numero.match(/F-\d{4}-(\d+)/); if (m) n = parseInt(m[1]) + 1 }
    const numero = `F-${y}-${String(n).padStart(3, '0')}`
    const r = transaction(() => {
      const factureResult = runInTx('INSERT INTO factures (numero, client_id, devis_id, notes) VALUES (?,?,?,?)', [numero, d.client_id, d.id, d.notes])
      lignes.forEach((l, i) => runInTx('INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre) VALUES (?,?,?,?,?)', [factureResult.lastInsertRowid, l.description, l.quantite, l.prix_unitaire, i]))
      runInTx("UPDATE devis SET statut = 'accepté' WHERE id = ?", [req.params.id])
      return factureResult
    })
    res.status(201).json(getOne('SELECT * FROM factures WHERE id = ?', [r.lastInsertRowid]))
  })

  // Factures
  server.get('/api/factures', (req, res) => res.json(getAll("SELECT f.*, c.nom as client_nom, (SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id) as total FROM factures f LEFT JOIN clients c ON f.client_id = c.id ORDER BY f.created_at DESC")))
  server.get('/api/factures/export-csv', (req, res) => {
    const annee = req.query.annee || String(new Date().getFullYear())
    const factures = getAll("SELECT f.numero, f.date_emission, c.nom as client_nom, COALESCE((SELECT SUM(quantite * prix_unitaire) FROM facture_lignes WHERE facture_id = f.id), 0) as total, f.statut FROM factures f LEFT JOIN clients c ON f.client_id = c.id WHERE strftime('%Y', f.date_emission) = ? ORDER BY f.date_emission ASC", [annee])
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`
    const header = ['Numéro', 'Date', 'Client', 'Montant HT (€)', 'Statut'].map(escape).join(',')
    const rows = factures.map(f => [f.numero, f.date_emission, f.client_nom || '', Number(f.total).toFixed(2), f.statut].map(escape).join(','))
    const csv = '\uFEFF' + [header, ...rows].join('\r\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="factures-${annee}.csv"`)
    res.send(csv)
  })
  server.get('/api/factures/:id', (req, res) => {
    const f = getOne('SELECT f.*, c.nom as client_nom, c.adresse as client_adresse, c.code_postal as client_code_postal, c.ville as client_ville, c.siret as client_siret FROM factures f LEFT JOIN clients c ON f.client_id = c.id WHERE f.id = ?', [req.params.id])
    if (!f) return res.status(404).json({ error: 'Non trouvé' })
    f.lignes = getAll('SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre', [req.params.id])
    res.json(f)
  })
  server.post('/api/factures', (req, res) => {
    try {
      const { client_id, date_emission, date_paiement, notes, lignes } = req.body
      const parsedClientId = client_id ? parseInt(client_id) : null
      const y = new Date().getFullYear()
      const last = getOne(`SELECT numero FROM factures WHERE numero LIKE 'F-${y}-%' ORDER BY id DESC LIMIT 1`)
      let n = 1; if (last) { const m = last.numero.match(/F-\d{4}-(\d+)/); if (m) n = parseInt(m[1]) + 1 }
      const numero = `F-${y}-${String(n).padStart(3, '0')}`
      const r = transaction(() => {
        const factureResult = runInTx('INSERT INTO factures (numero, client_id, date_emission, date_paiement, statut, notes) VALUES (?,?,?,?,?,?)', [numero, parsedClientId, date_emission, date_paiement, 'non payée', notes])
        const factureId = factureResult.lastInsertRowid
        if (lignes && lignes.length > 0) {
          lignes.forEach((l, i) => {
            runInTx('INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre) VALUES (?,?,?,?,?)',
              [factureId, l.description || '', parseFloat(l.quantite) || 0, parseFloat(l.prix_unitaire) || 0, i])
          })
        }
        return factureResult
      })
      res.status(201).json(getOne('SELECT * FROM factures WHERE id = ?', [r.lastInsertRowid]))
    } catch (error) {
      console.error('Erreur création facture:', error)
      res.status(500).json({ error: 'Erreur création facture' })
    }
  })
  server.put('/api/factures/:id', (req, res) => {
    try {
      const { client_id, date_emission, date_paiement, statut, notes, lignes } = req.body
      const parsedClientId = client_id ? parseInt(client_id) : null
      transaction(() => {
        runInTx('UPDATE factures SET client_id=?, date_emission=?, date_paiement=?, statut=?, notes=? WHERE id=?', [parsedClientId, date_emission, date_paiement, statut, notes, req.params.id])
        if (lignes) {
          runInTx('DELETE FROM facture_lignes WHERE facture_id=?', [req.params.id])
          lignes.forEach((l, i) => runInTx('INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, ordre) VALUES (?,?,?,?,?)',
            [req.params.id, l.description || '', parseFloat(l.quantite) || 0, parseFloat(l.prix_unitaire) || 0, i]))
        }
      })
      res.json(getOne('SELECT * FROM factures WHERE id = ?', [req.params.id]))
    } catch (error) {
      console.error('Erreur mise à jour facture:', error)
      res.status(500).json({ error: 'Erreur mise à jour facture' })
    }
  })
  server.patch('/api/factures/:id/paiement', (req, res) => {
    try {
      const date_paiement = new Date().toISOString().split('T')[0]
      transaction(() => { runInTx('UPDATE factures SET statut=?, date_paiement=? WHERE id=?', ['payée', date_paiement, req.params.id]) })
      res.json(getOne('SELECT * FROM factures WHERE id = ?', [req.params.id]))
    } catch (error) {
      console.error('Erreur paiement facture:', error)
      res.status(500).json({ error: 'Erreur paiement facture' })
    }
  })

  server.delete('/api/factures/:id', (req, res) => {
    transaction(() => { runInTx('DELETE FROM facture_lignes WHERE facture_id=?', [req.params.id]); runInTx('DELETE FROM factures WHERE id=?', [req.params.id]) })
    res.status(204).send()
  })

  // PDF helpers
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : ''
  const formatMoney = (a) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(a || 0).replace(/\u202F|\u00A0/g, ' ')

  // PDF Facture
  server.get('/api/factures/:id/pdf', (req, res) => {
    const f = getOne('SELECT f.*, c.nom as client_nom, c.adresse as client_adresse, c.code_postal as client_code_postal, c.ville as client_ville FROM factures f LEFT JOIN clients c ON f.client_id = c.id WHERE f.id = ?', [req.params.id])
    if (!f) return res.status(404).json({ error: 'Non trouvé' })
    const lignes = getAll('SELECT * FROM facture_lignes WHERE facture_id = ? ORDER BY ordre', [req.params.id])
    const p = getOne('SELECT * FROM parametres WHERE id = 1')

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${f.numero}.pdf"`)
    doc.pipe(res)

    doc.fontSize(20).font('Helvetica-Bold').text(p?.nom_entreprise || 'Mon Entreprise', 50, 50)
    doc.fontSize(10).font('Helvetica')
    let y = 75
    if (p?.prenom && p?.nom) { doc.text(`${p.prenom} ${p.nom}`, 50, y); y += 15 }
    if (p?.adresse) { doc.text(p.adresse, 50, y); y += 15 }
    if (p?.code_postal || p?.ville) { doc.text(`${p.code_postal || ''} ${p.ville || ''}`.trim(), 50, y); y += 15 }
    if (p?.siret) { doc.text(`SIRET: ${p.siret}`, 50, y) }

    doc.fontSize(24).font('Helvetica-Bold').text('FACTURE', 400, 50, { align: 'right' })
    doc.fontSize(12).font('Helvetica').text(`N° ${f.numero}`, 400, 80, { align: 'right' })
    doc.text(`Date: ${formatDate(f.date_emission)}`, 400, 95, { align: 'right' })

    doc.fontSize(12).font('Helvetica-Bold').text('Facturé à:', 350, 160)
    doc.fontSize(11).font('Helvetica')
    y = 175
    if (f.client_nom) { doc.text(f.client_nom, 350, y); y += 15 }
    if (f.client_adresse) { doc.text(f.client_adresse, 350, y); y += 15 }
    if (f.client_code_postal || f.client_ville) doc.text(`${f.client_code_postal || ''} ${f.client_ville || ''}`.trim(), 350, y)

    const tableTop = 270
    doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill()
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(10)
    doc.text('Description', 55, tableTop + 8, { width: 275 })
    doc.text('Qté', 330, tableTop + 8, { width: 50, align: 'right' })
    doc.text('Prix unit.', 385, tableTop + 8, { width: 70, align: 'right' })
    doc.text('Total', 460, tableTop + 8, { width: 80, align: 'right' })

    const tvaActive = p?.tva_active === 1
    const tauxTva = p?.taux_tva ?? 20.0

    let rowY = tableTop + 30, totalHT = 0
    doc.font('Helvetica').fontSize(10)
    lignes.forEach((l, i) => {
      if (rowY > 700) {
        doc.addPage()
        rowY = 50
        doc.fillColor('#f3f4f6').rect(50, rowY, 500, 25).fill()
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(10)
        doc.text('Description', 55, rowY + 8, { width: 275 })
        doc.text('Qté', 330, rowY + 8, { width: 50, align: 'right' })
        doc.text('Prix unit.', 385, rowY + 8, { width: 70, align: 'right' })
        doc.text('Total', 460, rowY + 8, { width: 80, align: 'right' })
        rowY += 30
        doc.font('Helvetica').fontSize(10)
      }
      const lt = l.quantite * l.prix_unitaire; totalHT += lt
      if (i % 2 === 1) { doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 20).fill() }
      doc.fillColor('#000')
      doc.text(l.description, 55, rowY, { width: 275 })
      doc.text(String(l.quantite), 330, rowY, { width: 50, align: 'right' })
      doc.text(formatMoney(l.prix_unitaire), 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(lt), 460, rowY, { width: 80, align: 'right' })
      rowY += 20
    })

    rowY += 10; doc.moveTo(50, rowY).lineTo(550, rowY).stroke(); rowY += 15
    doc.font('Helvetica-Bold').fontSize(12)

    if (tvaActive) {
      const montantTva = Math.round(totalHT * tauxTva) / 100
      const totalTTC = totalHT + montantTva
      doc.text('Total HT', 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(totalHT), 460, rowY, { width: 80, align: 'right' })
      rowY += 20
      doc.font('Helvetica').fontSize(11)
      doc.text(`TVA (${tauxTva}%)`, 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(montantTva), 460, rowY, { width: 80, align: 'right' })
      rowY += 20
      doc.font('Helvetica-Bold').fontSize(12)
      doc.text('Total TTC', 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(totalTTC), 460, rowY, { width: 80, align: 'right' })
      rowY += 30
    } else {
      doc.text('TOTAL HT', 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(totalHT), 460, rowY, { width: 80, align: 'right' })
      rowY += 30
      doc.font('Helvetica').fontSize(9).fillColor('#666').text('TVA non applicable, art. 293 B du CGI', 50, rowY)
      rowY += 0
    }

    if (p?.iban) { rowY += 25; doc.fillColor('#000').fontSize(10).text(`IBAN: ${p.iban}`, 50, rowY) }
    doc.end()
  })

  // PDF Devis
  server.get('/api/devis/:id/pdf', (req, res) => {
    const d = getOne('SELECT d.*, c.nom as client_nom, c.adresse as client_adresse, c.code_postal as client_code_postal, c.ville as client_ville FROM devis d LEFT JOIN clients c ON d.client_id = c.id WHERE d.id = ?', [req.params.id])
    if (!d) return res.status(404).json({ error: 'Non trouvé' })
    const lignes = getAll('SELECT * FROM devis_lignes WHERE devis_id = ? ORDER BY ordre', [req.params.id])
    const p = getOne('SELECT * FROM parametres WHERE id = 1')

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${d.numero}.pdf"`)
    doc.pipe(res)

    doc.fontSize(20).font('Helvetica-Bold').text(p?.nom_entreprise || 'Mon Entreprise', 50, 50)
    doc.fontSize(10).font('Helvetica')
    let y = 75
    if (p?.prenom && p?.nom) { doc.text(`${p.prenom} ${p.nom}`, 50, y); y += 15 }
    if (p?.adresse) { doc.text(p.adresse, 50, y); y += 15 }
    if (p?.code_postal || p?.ville) { doc.text(`${p.code_postal || ''} ${p.ville || ''}`.trim(), 50, y); y += 15 }
    if (p?.siret) { doc.text(`SIRET: ${p.siret}`, 50, y) }

    doc.fontSize(24).font('Helvetica-Bold').text('DEVIS', 400, 50, { align: 'right' })
    doc.fontSize(12).font('Helvetica').text(`N° ${d.numero}`, 400, 80, { align: 'right' })
    doc.text(`Date: ${formatDate(d.date_creation)}`, 400, 95, { align: 'right' })

    doc.fontSize(12).font('Helvetica-Bold').text('Client:', 350, 160)
    doc.fontSize(11).font('Helvetica')
    y = 175
    if (d.client_nom) { doc.text(d.client_nom, 350, y); y += 15 }
    if (d.client_adresse) { doc.text(d.client_adresse, 350, y); y += 15 }
    if (d.client_code_postal || d.client_ville) doc.text(`${d.client_code_postal || ''} ${d.client_ville || ''}`.trim(), 350, y)

    const tableTop = 270
    doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill()
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(10)
    doc.text('Description', 55, tableTop + 8, { width: 275 })
    doc.text('Qté', 330, tableTop + 8, { width: 50, align: 'right' })
    doc.text('Prix unit.', 385, tableTop + 8, { width: 70, align: 'right' })
    doc.text('Total', 460, tableTop + 8, { width: 80, align: 'right' })

    let rowY = tableTop + 30, total = 0
    doc.font('Helvetica').fontSize(10)
    lignes.forEach((l, i) => {
      if (rowY > 700) {
        doc.addPage()
        rowY = 50
        doc.fillColor('#f3f4f6').rect(50, rowY, 500, 25).fill()
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(10)
        doc.text('Description', 55, rowY + 8, { width: 275 })
        doc.text('Qté', 330, rowY + 8, { width: 50, align: 'right' })
        doc.text('Prix unit.', 385, rowY + 8, { width: 70, align: 'right' })
        doc.text('Total', 460, rowY + 8, { width: 80, align: 'right' })
        rowY += 30
        doc.font('Helvetica').fontSize(10)
      }
      const lt = l.quantite * l.prix_unitaire; total += lt
      if (i % 2 === 1) { doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 20).fill() }
      doc.fillColor('#000')
      doc.text(l.description, 55, rowY, { width: 275 })
      doc.text(String(l.quantite), 330, rowY, { width: 50, align: 'right' })
      doc.text(formatMoney(l.prix_unitaire), 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(lt), 460, rowY, { width: 80, align: 'right' })
      rowY += 20
    })

    rowY += 10; doc.moveTo(50, rowY).lineTo(550, rowY).stroke(); rowY += 15
    doc.font('Helvetica-Bold').fontSize(12)
    const tvaActiveDevis = p?.tva_active === 1
    const tauxTvaDevis = p?.taux_tva ?? 20.0
    if (tvaActiveDevis) {
      const montantTva = Math.round(total * tauxTvaDevis) / 100
      const totalTTC = total + montantTva
      doc.text('Total HT', 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(total), 460, rowY, { width: 80, align: 'right' })
      rowY += 20
      doc.font('Helvetica').fontSize(11)
      doc.text(`TVA (${tauxTvaDevis}%)`, 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(montantTva), 460, rowY, { width: 80, align: 'right' })
      rowY += 20
      doc.font('Helvetica-Bold').fontSize(12)
      doc.text('Total TTC', 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(totalTTC), 460, rowY, { width: 80, align: 'right' })
      rowY += 30
    } else {
      doc.text('TOTAL HT', 385, rowY, { width: 70, align: 'right' })
      doc.text(formatMoney(total), 460, rowY, { width: 80, align: 'right' })
      rowY += 30
      doc.font('Helvetica').fontSize(9).fillColor('#666').text('TVA non applicable, art. 293 B du CGI', 50, rowY)
    }
    rowY += 40
    doc.fontSize(10).fillColor('#000').text('Bon pour accord - Date et signature:', 50, rowY)
    doc.rect(50, rowY + 15, 200, 60).stroke()
    doc.end()
  })

  // Fallback SPA
  server.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'App Facturation',
    ...(process.platform === 'darwin' && {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 15, y: 15 }
    }),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    show: false
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
    if (process.platform === 'darwin') app.focus({ steal: true })
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  logFile = path.join(app.getPath('userData'), 'debug.log')
  try {
    log('App ready, début initialisation...')
    log('Initialisation de la base de données...')
    await initDatabase()
    log('Base de données initialisée')
    setupRoutes()
    log('Routes configurées')
    server.listen(PORT, () => {
      log(`Serveur démarré sur http://localhost:${PORT}`)
      createWindow()
      // Vérifier les mises à jour 5s après le démarrage
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => log('Vérification mise à jour: ' + err.message))
      }, 5000)
    })
  } catch (err) {
    log('Erreur au démarrage: ' + err.message + '\n' + err.stack)
    dialog.showErrorBox('Erreur de démarrage', err.message + '\n\n' + err.stack)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
