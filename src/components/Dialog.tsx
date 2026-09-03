import { useEffect, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'
import { X } from 'lucide-react'
import './Dialog.css'

interface DialogProps {
  open: boolean
  onClose: () => void
  /**
   * Control to focus after closing. The browser's own focus return only
   * covers the element that was focused when the dialog opened, which a
   * pointer click does not always set (Safari never focuses a clicked
   * button), so the trigger is handed in explicitly.
   */
  returnFocusTo?: HTMLElement | null
  labelledBy: string
  describedBy?: string
  className?: string
  children: ReactNode
}

/**
 * Native <dialog> wrapper. showModal() gives us the top layer, an inert page
 * behind it, Tab containment, and Escape (via `cancel`). Body scrolling is
 * locked while it is open. Every close path goes through `onClose`; the
 * `open` effect then closes the element and moves focus back to the trigger
 * in the same step, so focus return does not depend on the element's `close`
 * event, which Chrome delivers on the next animation frame (and never while
 * the tab is in the background).
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
  // Set by showModal(), cleared by the close that follows, so focus is only
  // returned after a real open and never on mount.
  const wasOpen = useRef(false)
  // Read at close time without making the open effect re-run when the
  // trigger changes.
  const returnRef = useRef(returnFocusTo)
  useEffect(() => {
    returnRef.current = returnFocusTo
  }, [returnFocusTo])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!open) {
      if (!wasOpen.current) return
      wasOpen.current = false
      // Escape without user activation lets the browser close the dialog
      // itself before this runs; close() is then a no-op.
      if (el.open) el.close()
      returnRef.current?.focus({ preventScroll: true })
      return
    }
    wasOpen.current = true
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

  // Escape. When the page has user activation the event is cancelable and the
  // dialog stays open until the effect closes it; otherwise the browser closes
  // it right after this handler, and the effect only returns focus.
  const onCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault()
    onClose()
  }

  // Any close the browser performs on its own still flows through state.
  const onNativeClose = () => {
    onClose()
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
