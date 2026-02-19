import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientHistorique from './pages/ClientHistorique'
import Prestations from './pages/Prestations'
import Devis from './pages/Devis'
import Factures from './pages/Factures'
import Urssaf from './pages/Urssaf'
import TVA from './pages/TVA'
import Parametres from './pages/Parametres'
import Aide from './pages/Aide'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientHistorique />} />
        <Route path="/prestations" element={<Prestations />} />
        <Route path="/devis" element={<Devis />} />
        <Route path="/factures" element={<Factures />} />
        <Route path="/urssaf" element={<Urssaf />} />
        <Route path="/tva" element={<TVA />} />
        <Route path="/parametres" element={<Parametres />} />
        <Route path="/aide" element={<Aide />} />
      </Routes>
    </Layout>
  )
}

export default App
