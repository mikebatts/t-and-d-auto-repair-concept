import { useEffect, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'
import { X } from 'lucide-react'
import './Dialog.css'

interface DialogProps {
  open: boolean
  onClose: () => void
  /** Control to focus after closing. Native return only works if the trigger was focused. */
  returnFocusTo?: HTMLElement | null
  labelledBy: string
  describedBy?: string
  className?: string
  children: ReactNode
}

/**
 * Native <dialog> wrapper. showModal() gives us the top layer, an inert page
 * behind it, Tab containment, Escape (via `cancel`), and focus return to the
 * element that opened it. Body scrolling is locked while it is open.
 */
export default function Dialog({
  open,
  onClose,
  returnFocusTo,
  labelledBy,
  describedBy,
  className = '',
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!open) {
      if (el.open) el.close()
      return
    }
    if (!el.open) el.showModal()
    document.documentElement.classList.add('has-dialog')
    const first = el.querySelector<HTMLElement>(
      '[data-autofocus], input:not([type=radio]), select, textarea, button:not(.dialog__close)',
    )
    first?.focus()
    return () => {
      document.documentElement.classList.remove('has-dialog')
    }
  }, [open])

  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault()
    onClose()
  }

  // Fired for every close path, including the browser closing on Escape when
  // it declines to make `cancel` preventable. Focus goes back to the trigger.
  const onNativeClose = () => {
    onClose()
    returnFocusTo?.focus()
  }

  const onBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose()
  }

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`.trim()}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      onCancel={onCancel}
      onClose={onNativeClose}
      onClick={onBackdrop}
    >
      <div className="dialog__panel">
        <button type="button" className="dialog__close" onClick={onClose} aria-label="Close">
          <X size={22} aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  )
}
