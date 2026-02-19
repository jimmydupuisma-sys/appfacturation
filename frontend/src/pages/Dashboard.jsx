import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Receipt, Building2, ChevronLeft, ChevronRight, Wallet, Percent } from 'lucide-react'
import { useDarkMode } from '../contexts/DarkMode'
import { EmptyState } from '../components/ui/helpers'

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0)
}

function StatCard({ title, value, icon: Icon, iconBg, valueColor }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide truncate">{title}</p>
          <p className={`text-xl font-semibold mt-0.5 font-mono tabular-nums ${valueColor || 'text-gray-900 dark:text-slate-100'}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CarouselStatCard({ slides, icon: Icon, iconBg }) {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={20} className="text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide truncate">{slide.title}</p>
          <p className={`text-xl font-semibold mt-0.5 font-mono tabular-nums ${slide.valueColor || 'text-gray-900 dark:text-slate-100'}`}>
            {slide.value}
          </p>
          <div className="flex gap-1 mt-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? 'bg-accent-400' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className={`px-3 py-2.5 rounded-xl shadow-lg border text-sm ${
      dark
        ? 'bg-[#161b27] border-[#1e2a3a] text-slate-200'
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <p className="font-medium mb-1.5 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p>CA HT : <span className="font-semibold font-mono">{formatMoney(data.ca)}</span></p>
      <p className="text-amber-400">URSSAF : <span className="font-semibold font-mono">{formatMoney(data.urssaf)}</span></p>
      {data.tva > 0 && <p className="text-violet-400">TVA : <span className="font-semibold font-mono">{formatMoney(data.tva)}</span></p>}
      <p className="text-emerald-400">Net : <span className="font-semibold font-mono">{formatMoney(data.net)}</span></p>
    </div>
  )
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-[#1a2236] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-gray-100 dark:bg-[#1a2236] animate-pulse" />
            <div className="h-5 w-32 rounded bg-gray-100 dark:bg-[#1a2236] animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SeuilTVABar({ caAnnuel, seuilTva, onActivate }) {
  if (!seuilTva) return null
  const rawPct = (caAnnuel / seuilTva) * 100
  const pct = Math.min(rawPct, 100)
  const isExceeded = rawPct > 100
  const isWarning = !isExceeded && pct >= 75 && pct < 90
  const isDanger = !isExceeded && pct >= 90

  const barColor = isExceeded ? 'bg-red-500' : isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-accent-500'
  const textColor = isExceeded ? 'text-red-500 dark:text-red-400' : isDanger ? 'text-red-500 dark:text-red-400' : isWarning ? 'text-amber-500 dark:text-amber-400' : 'text-accent-500 dark:text-accent-400'
  const label = isExceeded
    ? 'Seuil de franchise TVA dépassé'
    : isDanger
    ? 'Attention — seuil franchise TVA presque atteint'
    : isWarning
    ? 'Seuil franchise TVA approchant'
    : 'Franchise TVA'

  return (
    <Card className={`mb-6 ${isExceeded ? '!border-red-500/30 dark:!border-red-500/20' : ''}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium uppercase tracking-wide ${isExceeded ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>{label}</span>
          <div className="flex items-center gap-3">
            {isExceeded && (
              <button onClick={onActivate} className="text-xs font-medium text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors">
                Activer la TVA →
              </button>
            )}
            <span className={`text-xs font-semibold font-mono tabular-nums ${textColor}`}>
              {isExceeded ? `+${(rawPct - 100).toFixed(0)} %` : `${pct.toFixed(1)} %`}
            </span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#1a2236] overflow-hidden">
          <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400 dark:text-slate-600 font-mono tabular-nums">
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(caAnnuel)}</span>
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(seuilTva)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function SeuilCABar({ caAnnuel, seuilCa }) {
  if (!seuilCa) return null
  const pct = Math.min((caAnnuel / seuilCa) * 100, 100)
  const isWarning = pct >= 75 && pct < 90
  const isDanger = pct >= 90

  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-500'
    : 'bg-accent-500'

  const textColor = isDanger
    ? 'text-red-500 dark:text-red-400'
    : isWarning
    ? 'text-amber-500 dark:text-amber-400'
    : 'text-accent-500 dark:text-accent-400'

  const label = isDanger
    ? 'Attention — seuil micro-entreprise presque atteint'
    : isWarning
    ? 'Seuil micro-entreprise approchant'
    : 'Plafond micro-entreprise'

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
          <span className={`text-xs font-semibold font-mono tabular-nums ${textColor}`}>
            {pct.toFixed(1)} %
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-[#1a2236] overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400 dark:text-slate-600 font-mono tabular-nums">
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(caAnnuel)}</span>
          <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(seuilCa)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  const { dark } = useDarkMode()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartPeriode, setChartPeriode] = useState('')
  const [chartMode, setChartMode] = useState('mois')
  const [chartRef, setChartRef] = useState(() => {
    const now = new Date()
    return { annee: now.getFullYear(), date: now.toISOString().split('T')[0] }
  })
  const [hoveredBar, setHoveredBar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])
  useEffect(() => { loadChart() }, [chartMode, chartRef])

  async function loadStats() {
    try {
      const res = await fetch('/api/dashboard/stats')
      setStats(await res.json())
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function activerTVA() {
    try {
      const res = await fetch('/api/parametres')
      const params = await res.json()
      await fetch('/api/parametres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          tva_active: true,
          tva_date_debut: params.tva_date_debut || new Date().toISOString().split('T')[0]
        })
      })
      loadStats()
    } catch (error) {
      console.error('Erreur activation TVA:', error)
    }
  }

  async function loadChart() {
    try {
      const params = new URLSearchParams({ mode: chartMode })
      if (chartMode === 'mois') params.set('annee', chartRef.annee)
      if (chartMode === 'semaine') params.set('date', chartRef.date)
      const res = await fetch(`/api/dashboard/ca-chart?${params}`)
      const json = await res.json()
      setChartData(json.data)
      setChartPeriode(json.periode)
    } catch (error) {
      console.error('Erreur chargement graphique:', error)
    }
  }

  function navigateChart(direction) {
    setChartRef(prev => {
      if (chartMode === 'mois') return { ...prev, annee: prev.annee + direction }
      if (chartMode === 'semaine') {
        const d = new Date(prev.date)
        d.setDate(d.getDate() + direction * 7)
        return { ...prev, date: d.toISOString().split('T')[0] }
      }
      return prev
    })
  }

  const urssafReste = Math.max(0, (stats?.urssaf_du || 0) - (stats?.total_urssaf || 0))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${stats?.tva_active ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="CA Annuel"
              value={formatMoney(stats?.ca_annuel)}
              icon={TrendingUp}
              iconBg="bg-accent-500"
            />
            <CarouselStatCard
              icon={Building2}
              iconBg="bg-amber-500"
              slides={[
                {
                  title: `URSSAF (${stats?.taux_urssaf || 22}%)`,
                  value: formatMoney(stats?.urssaf_du),
                  valueColor: 'text-gray-900 dark:text-slate-100',
                },
                {
                  title: 'URSSAF payé',
                  value: formatMoney(stats?.total_urssaf),
                  valueColor: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  title: 'Reste à payer',
                  value: formatMoney(urssafReste),
                  valueColor: urssafReste > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400',
                },
              ]}
            />
            {stats?.tva_active && (
              <CarouselStatCard
                icon={Percent}
                iconBg="bg-violet-500"
                slides={[
                  {
                    title: `TVA collectée (${stats?.taux_tva || 20}%)`,
                    value: formatMoney(stats?.tva_collectee),
                    valueColor: 'text-gray-900 dark:text-slate-100',
                  },
                  {
                    title: 'TVA versée',
                    value: formatMoney(stats?.tva_versee),
                    valueColor: 'text-emerald-600 dark:text-emerald-400',
                  },
                  {
                    title: 'Reste à reverser',
                    value: formatMoney(stats?.tva_restante),
                    valueColor: (stats?.tva_restante || 0) > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                  },
                ]}
              />
            )}
            <StatCard
              title="Montant net"
              value={formatMoney(stats?.montant_net)}
              icon={Wallet}
              iconBg="bg-emerald-500"
              valueColor="text-emerald-700 dark:text-emerald-400"
            />
            <StatCard
              title="Factures (année)"
              value={stats?.nb_factures || 0}
              icon={Receipt}
              iconBg="bg-indigo-500"
            />
          </>
        )}
      </div>

      {/* Seuil TVA */}
      {!loading && !stats?.tva_active && stats?.seuil_tva > 0 && (
        <SeuilTVABar caAnnuel={stats.ca_annuel || 0} seuilTva={stats.seuil_tva} onActivate={activerTVA} />
      )}

      {/* Seuil CA */}
      {!loading && stats?.seuil_ca > 0 && (
        <SeuilCABar caAnnuel={stats.ca_annuel || 0} seuilCa={stats.seuil_ca} />
      )}

      {/* Chart */}
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              Chiffre d'affaires
            </h2>
            <div className="flex items-center gap-3">
              {/* Period toggle */}
              <div className="flex bg-gray-100 dark:bg-[#1a2236] rounded-lg p-0.5 gap-0.5">
                {[
                  { key: 'semaine', label: 'Sem.' },
                  { key: 'mois', label: 'Mois' },
                  { key: 'annee', label: 'An' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setChartMode(key)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors font-medium ${
                      chartMode === key
                        ? 'bg-white dark:bg-accent-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Navigation */}
              {chartMode !== 'annee' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateChart(-1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2236] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-500 dark:text-slate-400 min-w-[80px] text-center font-medium">
                    {chartPeriode}
                  </span>
                  <button
                    onClick={() => navigateChart(1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a2236] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: dark ? '#475569' : '#9ca3af', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}€`}
                  tick={{ fill: dark ? '#475569' : '#9ca3af', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip cursor={false} content={<CustomTooltip dark={dark} />} />
                <Bar dataKey="ca" radius={[6, 6, 0, 0]} onMouseLeave={() => setHoveredBar(null)}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={hoveredBar === index
                        ? (dark ? '#38bdf8' : '#0ea5e9')
                        : (dark ? '#0284c7' : '#7dd3fc')
                      }
                      onMouseEnter={() => setHoveredBar(index)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent invoices */}
      <Card>
        <CardContent>
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Dernières factures
          </h2>
          {stats?.dernieres_factures?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-[#1e2a3a]">
                  <th className="pb-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">Numéro</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">Client</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="pb-3 text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {stats.dernieres_factures.map((facture) => (
                  <tr key={facture.id} className="border-b last:border-0 border-gray-50 dark:border-[#1a2236]">
                    <td className="py-3 text-sm font-medium text-gray-900 dark:text-slate-200">{facture.numero}</td>
                    <td className="py-3 text-sm text-gray-500 dark:text-slate-400">{facture.client_nom || '—'}</td>
                    <td className="py-3 text-sm text-gray-500 dark:text-slate-400">
                      {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 text-sm text-right font-semibold font-mono tabular-nums text-gray-900 dark:text-slate-100">
                      {formatMoney(facture.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={Receipt} message="Aucune facture pour le moment" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
