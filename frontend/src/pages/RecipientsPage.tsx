import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { recipientApi, Recipient, RecipientCreate } from '../lib/api'
import RecipientRow from '../components/RecipientRow'
import StepBar from '../components/StepBar'
import { Plus, Upload } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'

export default function RecipientsPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)
  const navigate = useNavigate()

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<RecipientCreate, 'campaign_id'>>({
    name: '', email: '', company: '', role: '', linkedin_url: '',
  })
  const [adding, setAdding] = useState(false)

  const hasInFlight = recipients.some(r =>
    r.research_status === 'researching' || r.generation_status === 'generating'
  )

  const fetchRecipients = useCallback(async () => {
    const data = await recipientApi.list(campaignId)
    setRecipients(data)
  }, [campaignId])

  useEffect(() => { fetchRecipients() }, [fetchRecipients])
  usePolling(fetchRecipients, 2500, hasInFlight)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      const r = await recipientApi.create({ campaign_id: campaignId, ...form })
      setRecipients(prev => [...prev, r])
      setForm({ name: '', email: '', company: '', role: '', linkedin_url: '' })
      setShowForm(false)
    } finally {
      setAdding(false)
    }
  }

  async function handleResearch(r: Recipient) {
    const updated = await recipientApi.research(r.id)
    setRecipients(prev => prev.map(x => x.id === r.id ? updated : x))
  }

  async function handleGenerate(r: Recipient) {
    const updated = await recipientApi.generate(r.id)
    setRecipients(prev => prev.map(x => x.id === r.id ? updated : x))
  }

  async function handleSend(r: Recipient) {
    const updated = await recipientApi.send(r.id)
    setRecipients(prev => prev.map(x => x.id === r.id ? updated : x))
  }

  async function handleResearchAll() {
    const pending = recipients.filter(r => r.research_status === 'pending')
    for (const r of pending) {
      recipientApi.research(r.id)
    }
    await fetchRecipients()
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 h-13 flex items-center justify-between">
        <p className="text-sm font-medium">Recipients — {recipients.length} added</p>
        <button className="btn btn-primary" onClick={() => navigate(`/campaign/${campaignId}/preview`)}>
          Next: Preview Emails →
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5">
        <StepBar steps={[
          { label: 'Setup', status: 'done' },
          { label: 'Recipients', status: 'active' },
          { label: 'Preview', status: 'upcoming' },
          { label: 'Send', status: 'upcoming' },
        ]} />

        {/* Actions */}
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setShowForm(s => !s)}>
            <Plus size={12} /> Add Recipient
          </button>
          {recipients.some(r => r.research_status === 'pending') && (
            <button className="btn btn-sm btn-primary" onClick={handleResearchAll}>
              Research All
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card">
            <h3 className="text-sm font-medium mb-3">New Recipient</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email *</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Company</label>
                <input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Role</label>
                <input className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="CTO" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">LinkedIn URL (optional)</label>
                <input className="input" value={form.linkedin_url} onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/janedoe" />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? 'Adding…' : 'Add Recipient'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="card p-0">
          {recipients.length === 0 ? (
            <div className="py-14 text-center text-sm text-gray-400">
              No recipients yet. Add some above.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Recipient', 'Company', 'Role', 'Progress', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recipients.map(r => (
                  <RecipientRow
                    key={r.id}
                    recipient={r}
                    onResearch={() => handleResearch(r)}
                    onGenerate={() => handleGenerate(r)}
                    onSend={() => handleSend(r)}
                    onPreview={() => navigate(`/campaign/${campaignId}/preview?recipient=${r.id}`)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 leading-relaxed">
          <strong className="font-medium">AI Research Engine:</strong> Perplexity Sonar queries each recipient's public profile, recent company news, and tech stack. That context is injected directly into the Groq prompt so every email references something real and specific.
        </div>
      </div>
    </div>
  )
}
