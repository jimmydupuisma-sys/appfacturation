import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/facturation.db')
const db = new Database(dbPath)

// Activer les clés étrangères
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

  -- Insérer les paramètres par défaut si la table est vide
  INSERT OR IGNORE INTO parametres (id) VALUES (1);
`)

// Migration : ajouter montant_du_custom si absent
try {
  db.prepare("SELECT montant_du_custom FROM urssaf LIMIT 1").get()
} catch {
  db.exec("ALTER TABLE urssaf ADD COLUMN montant_du_custom REAL DEFAULT NULL")
}

// Migration : ajouter seuil_ca si absent
try {
  db.prepare("SELECT seuil_ca FROM parametres LIMIT 1").get()
} catch {
  db.exec("ALTER TABLE parametres ADD COLUMN seuil_ca REAL DEFAULT 77700")
}

export default db
