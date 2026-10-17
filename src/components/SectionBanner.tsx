import { Reveal } from '../hooks/useInView'

interface SectionBannerProps {
  eyebrow: string
  title: string
  description: string
  image: string
  reverse?: boolean
}

export function SectionBanner({ eyebrow, title, description, image, reverse }: SectionBannerProps) {
  return (
    <Reveal className={`hp-section-banner row align-items-center g-4 g-lg-5 ${reverse ? 'flex-lg-row-reverse' : ''}`}>
      <div className="col-lg-6">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="col-lg-6">
        <div className="hp-section-art">
          <span className="hp-section-art-halo" aria-hidden />
          <div className="hp-section-art-frame">
            <img src={image} alt="" loading="lazy" />
          </div>
        </div>
      </div>
    </Reveal>
  )
}
