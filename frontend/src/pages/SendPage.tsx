import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { recipientApi, campaignApi, Recipient, Campaign } from '../lib/api'
import StepBar from '../components/StepBar'
import { CheckCircle2, XCircle, Clock, Send, Loader2 } from 'lucide-react'
import { usePolling } from '../hooks/usePolling'
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

export default function SendPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sending, setSending] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)

  const fetchData = useCallback(async () => {
    const [camp, recs] = await Promise.all([
      campaignApi.get(campaignId),
      recipientApi.list(campaignId),
    ])
    setCampaign(camp)
    setRecipients(recs)
  }, [campaignId])

  useEffect(() => { fetchData() }, [fetchData])
  usePolling(fetchData, 3000, sending || sendingAll)

  const ready = recipients.filter(r => r.generation_status === 'done')
  const queued = ready.filter(r => r.send_status === 'queued')
  const sent   = recipients.filter(r => r.send_status === 'sent')
  const failed = recipients.filter(r => r.send_status === 'failed')

  async function handleSendOne(r: Recipient) {
    setSending(true)
    try {
      const updated = await recipientApi.send(r.id)
      setRecipients(prev => prev.map(x => x.id === r.id ? updated : x))
    } catch (e: any) {
      alert(`Send failed: ${e?.response?.data?.detail || e.message}`)
    } finally {
      setSending(false)
    }
  }

  async function handleSendAll() {
    if (!confirm(`Send ${queued.length} emails now?`)) return
    setSendingAll(true)
    try {
      await recipientApi.sendAll(campaignId)
      await fetchData()
    } catch (e: any) {
      alert(`Send failed: ${e?.response?.data?.detail || e.message}`)
    } finally {
      setSendingAll(false)
    }
  }

  function statusIcon(r: Recipient) {
    if (r.send_status === 'sent') return <CheckCircle2 size={15} className="text-green-500" />
    if (r.send_status === 'failed') return <XCircle size={15} className="text-red-400" />
    return <Clock size={15} className="text-gray-300" />
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 h-13 flex items-center justify-between">
        <p className="text-sm font-medium">Send Queue</p>
        {queued.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleSendAll}
            disabled={sendingAll}
          >
            {sendingAll
              ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
              : <><Send size={13} /> Send All ({queued.length})</>}
          </button>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5">
        <StepBar steps={[
          { label: 'Setup', status: 'done' },
          { label: 'Recipients', status: 'done' },
          { label: 'Preview', status: 'done' },
          { label: 'Send', status: 'active' },
        ]} />

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: recipients.length, color: 'text-gray-800' },
            { label: 'Sent', value: sent.length, color: 'text-green-600' },
            { label: 'Queued', value: queued.length, color: 'text-yellow-600' },
            { label: 'Failed', value: failed.length, color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={clsx('text-2xl font-semibold', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Queue list */}
        <div className="card p-0">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-medium">Email Queue</p>
            {campaign && (
              <p className="text-xs text-gray-400">
                {campaign.send_delay_seconds > 0 ? `${campaign.send_delay_seconds}s delay between sends` : 'No delay'}
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {ready.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400">
                No emails ready to send. Generate emails in the Recipients step.
              </p>
            ) : ready.map(r => (
              <div key={r.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(r.name))}>
                  {initials(r.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.email}</p>
                </div>
                <div className="text-xs text-gray-400 truncate max-w-[240px] hidden md:block">
                  {r.generated_subject}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {statusIcon(r)}
                  <span className={clsx(
                    'text-xs font-medium',
                    r.send_status === 'sent' && 'text-green-600',
                    r.send_status === 'failed' && 'text-red-500',
                    r.send_status === 'queued' && 'text-gray-400',
                  )}>
                    {r.send_status === 'sent' ? 'Sent' : r.send_status === 'failed' ? 'Failed' : 'Queued'}
                  </span>
                  {r.send_status === 'queued' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleSendOne(r)}
                      disabled={sending}
                    >
                      Send
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gmail note */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 leading-relaxed">
          <strong className="font-medium">Gmail SMTP:</strong> Emails are sent directly from your Gmail account using an App Password. Make sure <code className="bg-amber-100 px-1 rounded">GMAIL_USER</code> and <code className="bg-amber-100 px-1 rounded">GMAIL_APP_PASSWORD</code> are set in your <code className="bg-amber-100 px-1 rounded">.env</code> file.
        </div>
      </div>
    </div>
  )
}
