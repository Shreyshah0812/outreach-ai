import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { recipientApi, Recipient } from '../lib/api'
import StepBar from '../components/StepBar'
import { RefreshCw, Edit2, Check } from 'lucide-react'
import clsx from 'clsx'

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selected, setSelected] = useState<Recipient | null>(null)
  const [editing, setEditing] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    recipientApi.list(campaignId).then(data => {
      const ready = data.filter(r => r.generation_status === 'done')
      setRecipients(ready)
      const preselect = searchParams.get('recipient')
      const initial = preselect ? ready.find(r => r.id === Number(preselect)) : ready[0]
      if (initial) {
        setSelected(initial)
        setEditSubject(initial.generated_subject || '')
        setEditBody(initial.generated_body || '')
      }
    })
  }, [campaignId])

  function selectRecipient(r: Recipient) {
    setSelected(r)
    setEditSubject(r.generated_subject || '')
    setEditBody(r.generated_body || '')
    setEditing(false)
  }

  async function handleSaveEdit() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await recipientApi.update(selected.id, {
        generated_subject: editSubject,
        generated_body: editBody,
      })
      setSelected(updated)
      setRecipients(prev => prev.map(r => r.id === updated.id ? updated : r))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerate() {
    if (!selected) return
    setRegenerating(true)
    try {
      const updated = await recipientApi.generate(selected.id)
      // Poll until done
      let r = updated
      for (let i = 0; i < 20; i++) {
        await new Promise(res => setTimeout(res, 1500))
        r = await recipientApi.get(r.id)
        if (r.generation_status === 'done') break
      }
      setSelected(r)
      setEditSubject(r.generated_subject || '')
      setEditBody(r.generated_body || '')
      setRecipients(prev => prev.map(x => x.id === r.id ? r : x))
    } finally {
      setRegenerating(false)
    }
  }

  const score = selected?.personalization_score
  const scoreColor = score && score >= 80 ? 'text-green-600' : score && score >= 60 ? 'text-yellow-600' : 'text-red-500'

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 h-13 flex items-center justify-between">
        <p className="text-sm font-medium">Preview Emails — {recipients.length} ready</p>
        <button className="btn btn-primary" onClick={() => navigate(`/campaign/${campaignId}/send`)}>
          Next: Send Queue →
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5">
        <StepBar steps={[
          { label: 'Setup', status: 'done' },
          { label: 'Recipients', status: 'done' },
          { label: 'Preview', status: 'active' },
          { label: 'Send', status: 'upcoming' },
        ]} />

        {recipients.length === 0 ? (
          <div className="card py-14 text-center text-sm text-gray-400">
            No emails generated yet. Go to Recipients and click Generate.
          </div>
        ) : (
          <div className="grid grid-cols-[220px_1fr] gap-4 flex-1">
            {/* Recipient list */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Recipients</p>
              {recipients.map(r => (
                <div
                  key={r.id}
                  onClick={() => selectRecipient(r)}
                  className={clsx(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors',
                    selected?.id === r.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(r.name))}>
                    {initials(r.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{r.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.company} · {r.role}</p>
                  </div>
                  {r.send_status === 'sent' && <Check size={12} className="text-green-500 shrink-0 ml-auto" />}
                </div>
              ))}
            </div>

            {/* Email preview */}
            {selected && (
              <div className="card p-0 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">To: {selected.email}</p>
                  {editing ? (
                    <input
                      className="input text-sm font-medium"
                      value={editSubject}
                      onChange={e => setEditSubject(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm font-medium">{selected.generated_subject}</p>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 px-5 py-4">
                  {editing ? (
                    <textarea
                      className="input w-full h-full min-h-48 resize-none text-sm leading-relaxed"
                      value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                    />
                  ) : (
                    <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {selected.generated_body}
                    </pre>
                  )}
                </div>

                {/* Footer actions */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
                  {editing ? (
                    <>
                      <button className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                      <button className="btn btn-sm btn-primary" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm" onClick={handleRegenerate} disabled={regenerating}>
                        <RefreshCw size={11} className={regenerating ? 'animate-spin' : ''} />
                        {regenerating ? 'Regenerating…' : 'Regenerate'}
                      </button>
                      <button className="btn btn-sm" onClick={() => setEditing(true)}>
                        <Edit2 size={11} /> Edit
                      </button>
                    </>
                  )}
                  {score !== null && score !== undefined && (
                    <p className="ml-auto text-xs text-gray-400">
                      Personalization score: <span className={clsx('font-semibold', scoreColor)}>{Math.round(score)}</span>/100
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
