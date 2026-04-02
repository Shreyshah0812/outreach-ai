import { Check } from 'lucide-react'
import clsx from 'clsx'

interface Step {
  label: string
  status: 'done' | 'active' | 'upcoming'
}

export default function StepBar({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-4 py-2 w-fit text-xs">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          {i > 0 && <div className="w-px h-3 bg-gray-200 mx-2" />}
          <div
            className={clsx(
              'w-5 h-5 rounded-full flex items-center justify-center font-medium text-[10px]',
              step.status === 'done'    && 'bg-green-100 text-green-700',
              step.status === 'active'  && 'bg-blue-100 text-blue-700',
              step.status === 'upcoming'&& 'bg-gray-100 text-gray-400',
            )}
          >
            {step.status === 'done' ? <Check size={10} /> : i + 1}
          </div>
          <span
            className={clsx(
              'font-medium',
              step.status === 'done'    && 'text-green-700',
              step.status === 'active'  && 'text-blue-700',
              step.status === 'upcoming'&& 'text-gray-400',
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
