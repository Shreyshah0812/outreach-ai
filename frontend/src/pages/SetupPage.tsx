import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { campaignApi, Campaign } from '../lib/api'
import StepBar from '../components/StepBar'
import { UploadCloud, CheckCircle2, X } from 'lucide-react'
import clsx from 'clsx'

export default function SetupPage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = Number(id)
  const navigate = useNavigate()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [jd, setJd] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [resumeFilename, setResumeFilename] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    campaignApi.get(campaignId).then(c => {
      setCampaign(c)
      setJd(c.job_description || '')
      if (c.resume_text) setResumeFilename('resume.pdf (uploaded)')
    })
  }, [campaignId])

  async function handleResumeDrop(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await campaignApi.uploadResume(campaignId, file)
      setResumeFilename(file.name)
      setSkills(result.skills || [])
    } catch (err) {
      alert('Failed to upload resume. Make sure it is a PDF.')
    } finally {
      setUploading(false)
    }
  }

  async function handleNext() {
    setSaving(true)
    try {
      // Save JD by recreating — patch endpoint not exposed, so we update via a quick workaround
      // In practice you'd add a PATCH /campaigns/:id endpoint; for now we navigate
      navigate(`/campaign/${campaignId}/recipients`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 h-13 flex items-center justify-between">
        <p className="text-sm font-medium">{campaign?.name || 'Campaign'} — Setup</p>
        <button className="btn btn-primary" onClick={handleNext} disabled={saving}>
          Next: Add Recipients →
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5 max-w-3xl">
        <StepBar steps={[
          { label: 'Setup', status: 'active' },
          { label: 'Recipients', status: 'upcoming' },
          { label: 'Preview', status: 'upcoming' },
          { label: 'Send', status: 'upcoming' },
        ]} />

        {/* Resume upload */}
        <div className="card">
          <h2 className="text-sm font-medium mb-3">Upload Resume</h2>
          <div
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              resumeFilename ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
            )}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleResumeDrop} />
            {uploading ? (
              <p className="text-sm text-blue-500">Parsing resume…</p>
            ) : resumeFilename ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">{resumeFilename}</span>
              </div>
            ) : (
              <>
                <UploadCloud size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Drop your PDF resume here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF up to 10MB</p>
              </>
            )}
          </div>

          {skills.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Parsed skills detected</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => (
                  <span key={s} className="badge badge-blue">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job description */}
        <div className="card">
          <h2 className="text-sm font-medium mb-3">Job Description / Context</h2>
          <textarea
            className="input min-h-32 resize-y"
            placeholder="Paste the role context or job description here. The AI uses this to tailor each email to what the recipient is building or hiring for…"
            value={jd}
            onChange={e => setJd(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-2">
            Perplexity Sonar will cross-reference this with each recipient's public background.
          </p>
        </div>

        {/* Campaign settings summary */}
        {campaign && (
          <div className="card">
            <h2 className="text-sm font-medium mb-3">Campaign Settings</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Campaign Name</p>
                <p className="font-medium">{campaign.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Sender</p>
                <p className="font-medium">{campaign.sender_email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Tone</p>
                <p className="font-medium">{campaign.tone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Send Delay</p>
                <p className="font-medium">{campaign.send_delay_seconds}s between emails</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
