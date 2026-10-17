import { Link } from 'react-router-dom'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Reveal } from '../hooks/useInView'
import './homepage.css'
import './site-pages.css'

const STEPS = [
  {
    num: '01',
    title: 'Discover',
    text: 'Browse nearby home kitchens, cuisines, and dishes made with care by real home chefs.',
    image: '/images/cartoons/cartoon-step-discover.png',
  },
  {
    num: '02',
    title: 'Order',
    text: 'Add your favourites to cart, pick a delivery time, and pay securely — COD or online.',
    image: '/images/cartoons/cartoon-step-order.png',
  },
  {
    num: '03',
    title: 'Enjoy',
    text: 'Track your order and enjoy authentic homemade food delivered right to your door.',
    image: '/images/cartoons/cartoon-step-enjoy.png',
  },
]

const EXTRAS = [
  {
    title: 'Verified kitchens',
    text: 'Every home chef is reviewed so you can order with confidence.',
  },
  {
    title: 'Freshly prepared',
    text: 'Meals are cooked when you order — not sitting under a heat lamp.',
  },
  {
    title: 'Neighbourhood delivery',
    text: 'Support local cooks and get food that arrives warm and ready.',
  },
]

export function HowItWorksPage() {
  return (
    <div className="homepage site-page">
      <HomeNav active="how-it-works" />

      <header className="site-hero site-hero--how">
        <div className="site-hero-bg" aria-hidden>
          <img src="/images/cartoons/cartoon-step-order.png" alt="" />
          <div className="site-hero-shade" />
        </div>
        <div className="site-hero-inner">
          <p className="site-eyebrow">How it works</p>
          <h1>Homemade in three simple steps</h1>
          <p className="site-hero-lead">
            From discovering a kitchen nearby to enjoying a warm meal at home — Made by Maa keeps
            it simple.
          </p>
        </div>
      </header>

      <section className="site-section">
        <div className="site-steps">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 100}>
              <article className="site-step">
                <div className="site-step-art">
                  <img src={step.image} alt="" />
                </div>
                <span className="site-step-num">{step.num}</span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="site-section site-section--alt">
        <div className="site-section-head">
          <Reveal>
            <p className="site-eyebrow">Why it feels easy</p>
            <h2>Built around real home cooking</h2>
          </Reveal>
        </div>
        <div className="site-extras">
          {EXTRAS.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <article className="site-extra">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="site-cta-band">
        <Reveal>
          <div className="site-cta-band-inner">
            <div>
              <h2>Ready to taste homemade?</h2>
              <p>Explore kitchens near you and place your first order.</p>
            </div>
            <Link to="/kitchens" className="hp-btn hp-btn--primary">
              Browse kitchens
            </Link>
          </div>
        </Reveal>
      </section>

      <HomeFooter />
    </div>
  )
}
