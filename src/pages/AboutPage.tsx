import { Link } from 'react-router-dom'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Reveal } from '../hooks/useInView'
import './homepage.css'
import './about.css'

const PRINCIPLES = [
  {
    num: '01',
    title: 'Cooked at home',
    text: 'Every dish comes from a real kitchen — prepared to order, never mass-produced.',
  },
  {
    num: '02',
    title: 'Trusted chefs',
    text: 'We work with verified home cooks whose craft and consistency you can rely on.',
  },
  {
    num: '03',
    title: 'Local by design',
    text: 'Meals travel a short distance from neighbourhood kitchens to your table.',
  },
]

const VALUES = [
  {
    title: 'Authenticity',
    text: 'Recipes rooted in home tradition — spices measured by heart, not by factory formula.',
    image: '/images/cartoons/cartoon-dishes.png',
  },
  {
    title: 'Care',
    text: 'Every plate is prepared with the same attention you’d expect from family.',
    image: '/images/cartoons/cartoon-kitchens.png',
  },
  {
    title: 'Community',
    text: 'We help home chefs earn from their craft and neighbours discover something better.',
    image: '/images/cartoons/cartoon-step-enjoy.png',
  },
]

export function AboutPage() {
  return (
    <div className="homepage about-page">
      <HomeNav active="about" />

      <header className="about-hero">
        <div className="about-hero-atmosphere" aria-hidden>
          <div className="about-hero-wash" />
          <div className="about-hero-glow about-hero-glow--a" />
          <div className="about-hero-glow about-hero-glow--b" />
        </div>

        <div className="about-hero-inner">
          <div className="about-hero-copy">
            <p className="about-brand">Made by Maa</p>
            <h1>
              The taste of home,
              <em> closer than you think</em>
            </h1>
            <p className="about-hero-lead">
              A platform connecting neighbourhoods with verified home chefs — so every meal feels
              personal, fresh, and truly homemade.
            </p>
            <div className="about-hero-actions">
              <Link to="/kitchens" className="hp-btn hp-btn--primary">
                Explore kitchens
              </Link>
              <Link to="/contact" className="hp-btn hp-btn--ghost">
                Get in touch
              </Link>
            </div>
          </div>

          <div className="about-hero-visual">
            <div className="about-portrait about-portrait--hero">
              <span className="about-portrait-ring" aria-hidden />
              <span className="about-portrait-halo" aria-hidden />
              <div className="about-portrait-frame">
                <img src="/images/cartoons/cartoon-hero.png" alt="" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="about-mission" aria-label="Our mission">
        <Reveal>
          <blockquote className="about-mission-quote">
            <p>
              We believe the best food isn’t always from a restaurant — it’s from a home kitchen,
              where recipes are passed down and every plate carries care.
            </p>
          </blockquote>
        </Reveal>
      </section>

      <section className="about-story">
        <div className="about-story-grid">
          <Reveal>
            <div className="about-portrait about-portrait--story">
              <span className="about-portrait-halo about-portrait-halo--warm" aria-hidden />
              <div className="about-portrait-frame">
                <img
                  src="/images/cartoons/cartoon-cta.png"
                  alt="Home chef celebrating homemade cooking"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="about-story-copy">
              <p className="about-kicker">Our story</p>
              <h2>Built around the kitchen table</h2>
              <p>
                Made by Maa started with a simple observation: exceptional cooking already happens
                in homes across every neighbourhood — it just needed a way to reach the people next
                door.
              </p>
              <p>
                Today we give talented home chefs a place to share their craft, and give you an
                easy way to discover meals that feel warm, honest, and made with intention.
              </p>
              <Link to="/how-it-works" className="about-text-link">
                See how it works
                <i className="bi bi-arrow-right" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-principles">
        <div className="about-principles-head">
          <Reveal>
            <p className="about-kicker">How we work</p>
            <h2>Three principles that guide every order</h2>
          </Reveal>
        </div>
        <div className="about-principles-list">
          {PRINCIPLES.map((item, i) => (
            <Reveal key={item.num} delay={i * 90}>
              <article className="about-principle">
                <span className="about-principle-num">{item.num}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-values">
        <div className="about-values-head">
          <Reveal>
            <p className="about-kicker">What we stand for</p>
            <h2>Values that shape the experience</h2>
          </Reveal>
        </div>
        <div className="about-values-grid">
          {VALUES.map((value, i) => (
            <Reveal key={value.title} delay={i * 100}>
              <article className="about-value">
                <div className="about-portrait about-portrait--value">
                  <div className="about-portrait-frame">
                    <img src={value.image} alt="" />
                  </div>
                </div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="about-close">
        <Reveal>
          <div className="about-close-inner">
            <div className="about-close-copy">
              <p className="about-kicker about-kicker--on-dark">Join us</p>
              <h2>Real kitchens. Real people. Real taste.</h2>
              <p>
                Discover homemade meals from cooks nearby — and support the craft that makes every
                neighbourhood feel a little more like home.
              </p>
              <div className="about-close-actions">
                <Link to="/kitchens" className="hp-btn hp-btn--primary">
                  Browse kitchens
                </Link>
                <Link to="/register" className="hp-btn hp-btn--ghost about-close-ghost">
                  Create an account
                </Link>
              </div>
            </div>
            <div className="about-portrait about-portrait--close" aria-hidden>
              <span className="about-portrait-halo about-portrait-halo--soft" />
              <div className="about-portrait-frame">
                <img src="/images/cartoons/cartoon-step-discover.png" alt="" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <HomeFooter />
    </div>
  )
}
