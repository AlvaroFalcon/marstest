import type { ReactNode } from 'react'
import { ListTree, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AiBlockProps = {
  /** Already worded by the caller, always starting with "AI" ("AI diagnosis", "AI signal · possible delay"). */
  title: string
  /** The AI text. */
  children: ReactNode
  /** Where the statement comes from. With `onClick` it is a button that opens the evidence. */
  evidence?: { label: string, onClick?: () => void }
  className?: string
}

/**
 * The single blue block that wraps every piece of AI-written content (ADR 0029), so people can
 * always tell machine text from carrier facts. The title carries an "AI" label and a sparkles icon
 * (never colour alone) and the footer states what the text is based on; when the caller provides
 * `onClick` the footer becomes a real button, otherwise it is plain text.
 */
export function AiBlock({ title, children, evidence, className }: AiBlockProps) {
  return (
    // Outer element is the size container: cqi units only resolve against an ancestor container.
    <div className={cn('@container', className)}>
      <section className="flex flex-col gap-2.5 rounded-lg border border-info bg-info-subtle px-5 py-4.5">
        <header className="flex items-center gap-2 text-ai-title font-semibold text-info">
          <Sparkles aria-hidden className="size-4 shrink-0" />
          <h2>{title}</h2>
        </header>
        <div className="text-ai-body text-foreground">{children}</div>
        <AiEvidence evidence={evidence} />
      </section>
    </div>
  )
}

type AiEvidenceProps = {
  evidence: AiBlockProps['evidence']
}

function AiEvidence({ evidence }: AiEvidenceProps) {
  if (evidence === undefined) {
    return null
  }

  return <AiEvidenceFooter {...evidence} />
}

type AiEvidenceFooterProps = NonNullable<AiBlockProps['evidence']>

function AiEvidenceFooter({ label, onClick }: AiEvidenceFooterProps) {
  const content = (
    <>
      <ListTree aria-hidden className="size-4 shrink-0" />
      {label}
    </>
  )

  if (onClick === undefined) {
    return <p className="flex items-center gap-2 text-ai-footer text-info">{content}</p>
  }

  return (
    <button
      className="
        flex w-fit items-center gap-2 rounded-sm text-ai-footer text-info outline-hidden
        focus-visible:ring-3 focus-visible:ring-ring
        [@media(hover:hover)]:hover:underline
      "
      onClick={onClick}
      type="button"
    >
      {content}
    </button>
  )
}
