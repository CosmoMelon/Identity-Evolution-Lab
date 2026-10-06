import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowRight, Check, ChevronRight } from 'lucide-react'

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>
}

export function Eyebrow({ children }: { children: ReactNode }) { return <div className="eyebrow">{children}</div> }

export function Status({ children, tone = 'neutral' }: { children: ReactNode, tone?: 'neutral' | 'good' | 'bad' | 'warn' }) {
  return <span className={`status status-${tone}`}>{children}</span>
}

export function Panel({ children, className = '' }: { children: ReactNode, className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function Flow({ steps, active = -1, direction = 'vertical' }: { steps: (string | ReactNode)[], active?: number, direction?: 'vertical' | 'horizontal' }) {
  return <div className={`flow flow-${direction}`}>
    {steps.map((step, index) => <div className="flow-piece" key={index}>
      <div className={`flow-node ${active === index ? 'flow-node-active' : ''} ${active > index ? 'flow-node-done' : ''}`}>
        {active > index ? <Check size={15} aria-hidden="true" /> : <span className="flow-index">{String(index + 1).padStart(2, '0')}</span>}
        <span>{step}</span>
      </div>
      {index < steps.length - 1 && (direction === 'vertical' ? <div className="flow-line" /> : <ChevronRight size={17} className="flow-arrow" aria-hidden="true" />)}
    </div>)}
  </div>
}

export function Insight({ label, children, tone = 'teal' }: { label: string, children: ReactNode, tone?: 'teal' | 'amber' | 'blue' }) {
  return <div className={`insight insight-${tone}`}><div className="insight-label">{label}</div><div>{children}</div></div>
}

export function LinkArrow({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-2">{children}<ArrowRight size={16} aria-hidden="true" /></span> }
