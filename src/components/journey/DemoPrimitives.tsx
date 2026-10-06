import type { ReactNode } from 'react'
import { CheckCircle2, CircleAlert, Terminal } from 'lucide-react'
import { Panel, Status } from '../ui'

export function DemoFrame({ title, subtitle, children, badge }: { title: string, subtitle?: string, children: ReactNode, badge?: string }) {
  return <Panel className="demo-frame"><div className="demo-topline"><div><div className="demo-window-label"><span className="window-dots"><i /><i /><i /></span>{title}</div>{subtitle && <p className="demo-subtitle">{subtitle}</p>}</div>{badge && <Status>{badge}</Status>}</div><div className="demo-body">{children}</div></Panel>
}

export function Result({ success, title, children, code }: { success: boolean, title: string, children?: ReactNode, code?: string }) {
  return <div className={`result ${success ? 'result-good' : 'result-bad'}`} role="status">{success ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}<div><strong>{title}</strong>{children && <p>{children}</p>}</div>{code && <span className="result-code">{code}</span>}</div>
}

export function CodeBlock({ children, label }: { children: ReactNode, label?: string }) {
  return <div className="code-block">{label && <div className="code-label"><Terminal size={13} />{label}</div>}<pre>{children}</pre></div>
}
