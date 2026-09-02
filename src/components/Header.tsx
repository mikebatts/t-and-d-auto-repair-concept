import { useRef, useState, type KeyboardEvent } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { business } from '../lib/business'
import Monogram from './Monogram'
import './Header.css'

const links = [
  { href: '#service', label: 'Service' },
  { href: '#work', label: 'Work' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const close = () => setOpen(false)
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && open) {
      setOpen(false)
      toggleRef.current?.focus()
    }
  }

  return (
    <header className="site-header surface-dark" onKeyDown={onKeyDown}>
      <div className="container site-header__row">
        <a className="brand" href="#main" aria-label="T & D Auto Repair, back to the top">
          <Monogram />
          <span className="brand__text">
            <span className="brand__name">T&amp;D</span>
            <span className="brand__slash" aria-hidden="true">
              /
            </span>
            <span className="brand__desc">Auto Repair</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="Site" id="site-nav" data-open={open || undefined}>
          <ul className="site-nav__list">
            {links.map((l) => (
              <li key={l.href}>
                <a className="site-nav__link" href={l.href} onClick={close}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a className="btn btn--primary site-header__call" href={business.shopPhone.href}>
            <Phone size={18} aria-hidden="true" />
            <span className="site-header__call-text">Call now</span>
            <span className="visually-hidden">, {business.shopPhone.display}</span>
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="btn btn--ghost site-header__menu"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            <span className="site-header__menu-text">Menu</span>
          </button>
        </div>
      </div>
    </header>
  )
}
