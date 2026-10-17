import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Reveal } from '../hooks/useInView'
import './homepage.css'
import './site-pages.css'

const CHANNELS = [
  {
    title: 'Email',
    detail: 'hello@madebymaa.online',
    href: 'mailto:hello@madebymaa.online',
    icon: 'bi-envelope-fill',
  },
  {
    title: 'WhatsApp',
    detail: 'Chat with support',
    href: 'https://wa.me/',
    icon: 'bi-whatsapp',
  },
  {
    title: 'Orders help',
    detail: 'Track and manage in your profile',
    href: '/orders',
    icon: 'bi-bag-check-fill',
  },
]

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    const subject = encodeURIComponent(`Made by Maa contact — ${name.trim()}`)
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    )
    window.location.href = `mailto:hello@madebymaa.online?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="homepage site-page">
      <HomeNav active="contact" />

      <header className="site-hero site-hero--contact">
        <div className="site-hero-bg" aria-hidden>
          <img src="/images/cartoons/cartoon-cta.png" alt="" />
          <div className="site-hero-shade" />
        </div>
        <div className="site-hero-inner">
          <p className="site-eyebrow">Contact us</p>
          <h1>We’re here to help</h1>
          <p className="site-hero-lead">
            Questions about an order, a kitchen, or joining Made by Maa? Reach out — we’d love to
            hear from you.
          </p>
        </div>
      </header>

      <section className="site-section">
        <div className="contact-layout">
          <Reveal>
            <div className="contact-channels">
              <p className="site-eyebrow">Reach us</p>
              <h2>Let’s talk</h2>
              <p className="contact-intro">
                Prefer email, chat, or order support — pick the path that works for you.
              </p>
              <ul className="contact-channel-list">
                {CHANNELS.map((channel) => {
                  const external = channel.href.startsWith('http') || channel.href.startsWith('mailto:')
                  const content = (
                    <>
                      <span className="contact-channel-icon" aria-hidden>
                        <i className={`bi ${channel.icon}`} />
                      </span>
                      <span>
                        <strong>{channel.title}</strong>
                        <small>{channel.detail}</small>
                      </span>
                    </>
                  )
                  return (
                    <li key={channel.title}>
                      {external ? (
                        <a href={channel.href} className="contact-channel">
                          {content}
                        </a>
                      ) : (
                        <Link to={channel.href} className="contact-channel">
                          {content}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <form className="contact-form" onSubmit={onSubmit}>
              <h2>Send a message</h2>
              <label className="site-field">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="site-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="site-field">
                <span>Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={5}
                  required
                />
              </label>
              <button type="submit" className="hp-btn hp-btn--primary contact-submit">
                Send message
              </button>
              {sent && (
                <p className="contact-sent" role="status">
                  Opening your email app… If nothing opens, write us at hello@madebymaa.online.
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </section>

      <HomeFooter />
    </div>
  )
}
