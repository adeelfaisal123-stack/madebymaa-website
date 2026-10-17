import './Preloader.css'

interface PreloaderProps {
  show: boolean
}

export function Preloader({ show }: PreloaderProps) {
  if (!show) return null

  return (
    <div className="preloader" role="status" aria-live="polite">
      <div className="preloader-spinner" />
      <span className="visually-hidden">Loading</span>
    </div>
  )
}
