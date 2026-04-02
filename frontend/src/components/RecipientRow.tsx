import { Recipient } from '../lib/api'
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  recipient: Recipient
  onResearch: () => void
  onGenerate: () => void
  onSend: () => void
  onPreview: () => void
}

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
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function RecipientRow({ recipient, onResearch, onGenerate, onSend, onPreview }: Props) {
  const { research_status, generation_status, send_status } = recipient

  const researchIcon = () => {
    if (research_status === 'researching') return <Loader2 size={13} className="animate-spin text-blue-500" />
    if (research_status === 'done') return <CheckCircle2 size={13} className="text-green-500" />
    if (research_status === 'failed') return <AlertCircle size={13} className="text-red-400" />
    return <Clock size={13} className="text-gray-300" />
  }

  const genIcon = () => {
    if (generation_status === 'generating') return <Loader2 size={13} className="animate-spin text-blue-500" />
    if (generation_status === 'done') return <CheckCircle2 size={13} className="text-green-500" />
    if (generation_status === 'failed') return <AlertCircle size={13} className="text-red-400" />
    return <Clock size={13} className="text-gray-300" />
  }

  const sendBadge = () => {
    if (send_status === 'sent') return <span className="badge badge-green">Sent</span>
    if (send_status === 'failed') return <span className="badge badge-red">Failed</span>
    return <span className="badge badge-gray">Queued</span>
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold', avatarColor(recipient.name))}>
            {initials(recipient.name)}
          </div>
          <div>
            <p className="text-sm font-medium">{recipient.name}</p>
            <p className="text-xs text-gray-400">{recipient.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{recipient.company || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{recipient.role || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">{researchIcon()} Research</span>
          <span className="flex items-center gap-1">{genIcon()} Email</span>
        </div>
      </td>
      <td className="px-4 py-3">{sendBadge()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {research_status === 'pending' && (
            <button className="btn btn-sm" onClick={onResearch}>Research</button>
          )}
          {research_status === 'done' && generation_status === 'pending' && (
            <button className="btn btn-sm" onClick={onGenerate}>Generate</button>
          )}
          {generation_status === 'done' && (
            <button className="btn btn-sm" onClick={onPreview}>Preview</button>
          )}
          {generation_status === 'done' && send_status === 'queued' && (
            <button className="btn btn-sm btn-primary" onClick={onSend}>Send</button>
          )}
        </div>
      </td>
    </tr>
  )
}
