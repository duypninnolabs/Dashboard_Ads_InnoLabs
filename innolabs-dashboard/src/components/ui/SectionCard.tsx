import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function SectionCard({ title, icon: Icon, children, action, className = '' }: SectionCardProps) {
  return (
    <section className={`panel ${className}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className="text-primary" size={22} />
          <h2 className="font-headline text-lg font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
