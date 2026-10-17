import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  COUNTRY_DIAL_CODES,
  flagEmoji,
  type CountryDialCode,
} from '../data/countryDialCodes'
import './CountryDialSelect.css'

interface CountryDialSelectProps {
  value: CountryDialCode
  onChange: (country: CountryDialCode) => void
  disabled?: boolean
  detecting?: boolean
}

interface PanelPos {
  top: number
  left: number
  width: number
  maxHeight: number
  openUp: boolean
}

export function CountryDialSelect({
  value,
  onChange,
  disabled,
  detecting,
}: CountryDialSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<PanelPos | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRY_DIAL_CODES
    return COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.isoCode.toLowerCase().includes(q),
    )
  }, [query])

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = Math.min(340, Math.max(280, window.innerWidth - 24))
    const spaceBelow = window.innerHeight - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow
    const maxHeight = Math.min(320, Math.max(160, openUp ? spaceAbove : spaceBelow))
    let left = rect.left
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12)
    }
    setPos({
      top: openUp ? rect.top - 8 : rect.bottom + 8,
      left,
      width,
      maxHeight,
      openUp,
    })
  }

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    updatePosition()
    const onScroll = () => updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
      setQuery('')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => searchRef.current?.focus(), 30)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open])

  const panel =
    open &&
    pos &&
    createPortal(
      <div
        ref={panelRef}
        className={`cds-panel${pos.openUp ? ' is-up' : ''}`}
        role="presentation"
        style={{
          top: pos.openUp ? undefined : pos.top,
          bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
          left: pos.left,
          width: pos.width,
          maxHeight: pos.maxHeight,
        }}
      >
        <div className="cds-search">
          <i className="bi bi-search" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code"
            aria-label="Search country"
          />
        </div>
        <ul
          id={listId}
          className="cds-list"
          role="listbox"
          aria-label="Country"
          style={{ maxHeight: Math.max(120, pos.maxHeight - 56) }}
        >
          {filtered.length === 0 && (
            <li className="cds-empty" role="presentation">
              No countries found
            </li>
          )}
          {filtered.map((country) => {
            const selected = country.isoCode === value.isoCode
            return (
              <li key={country.isoCode} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`cds-option${selected ? ' is-selected' : ''}`}
                  onClick={() => {
                    onChange(country)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <span className="cds-flag" aria-hidden>
                    {flagEmoji(country.isoCode)}
                  </span>
                  <span className="cds-name">{country.name}</span>
                  <span className="cds-dial">{country.dialCode}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>,
      document.body,
    )

  return (
    <div className={`cds ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="cds-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-busy={detecting || undefined}
        title={value.name}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="cds-flag" aria-hidden>
          {detecting ? '…' : flagEmoji(value.isoCode)}
        </span>
        <span className="cds-code">{value.dialCode}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} aria-hidden />
      </button>
      {panel}
    </div>
  )
}
