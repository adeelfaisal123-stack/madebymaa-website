import { useNavigate } from 'react-router-dom'

interface HeroLightProps {
  title: string
  search?: string
  onSearchChange?: (value: string) => void
  placeholder?: string
  trailing?: React.ReactNode
}

export function HeroLight({
  title,
  search,
  onSearchChange,
  placeholder = 'Search…',
  trailing,
}: HeroLightProps) {
  const navigate = useNavigate()

  return (
    <div className="hero-light">
      <div className="hero-title-row">
        <button type="button" className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="hero-title">{title}</h1>
        {trailing}
      </div>
      {onSearchChange && (
        <input
          className="search-field"
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

export function OpenClosedToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (value: boolean | null) => void
}) {
  return (
    <div className="open-closed-toggle">
      <button
        type="button"
        className={value === true ? 'active open' : ''}
        onClick={() => onChange(value === true ? null : true)}
      >
        Open
      </button>
      <button
        type="button"
        className={value === false ? 'active closed' : ''}
        onClick={() => onChange(value === false ? null : false)}
      >
        Closed
      </button>
    </div>
  )
}

export function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number
  onChange: (quantity: number) => void
}) {
  return (
    <div className="qty-stepper">
      <button type="button" onClick={() => onChange(quantity - 1)} aria-label="Decrease">
        −
      </button>
      <span>{quantity}</span>
      <button type="button" onClick={() => onChange(quantity + 1)} aria-label="Increase">
        +
      </button>
    </div>
  )
}
