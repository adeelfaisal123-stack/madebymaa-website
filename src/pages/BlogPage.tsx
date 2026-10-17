import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBlogPosts } from '../api/optica2'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Reveal } from '../hooks/useInView'
import type { BlogPost } from '../types'
import './homepage.css'
import './site-pages.css'
import './blog.css'

function formatBlogDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await fetchBlogPosts()
        if (!cancelled) setPosts(list)
      } catch {
        if (!cancelled) setError('Could not load stories. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="homepage blog-page">
      <HomeNav active="blog" />

      <header className="blog-hero">
        <div className="blog-hero-bg" aria-hidden />
        <div className="blog-hero-inner">
          <p className="site-eyebrow">Stories</p>
          <h1>From our kitchens to yours</h1>
          <p className="blog-hero-lead">
            Notes on home cooking, neighbourhood chefs, and the craft behind every Made by Maa meal.
          </p>
        </div>
      </header>

      <section className="blog-section">
        {loading ? (
          <div className="blog-state" role="status">
            <div className="blog-spinner" aria-hidden />
            <p>Loading stories…</p>
          </div>
        ) : error ? (
          <div className="blog-state">
            <h2>Something went wrong</h2>
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="blog-empty">
            <h2>No stories yet</h2>
            <p>Check back soon — we are cooking up the first posts.</p>
            <Link to="/kitchens" className="hp-btn hp-btn--primary" style={{ marginTop: 20 }}>
              Browse kitchens
            </Link>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post, i) => {
              const date = formatBlogDate(post.publishedAt)
              const meta = [post.authorName, date].filter(Boolean).join(' · ')
              return (
                <Reveal key={post.id} delay={Math.min(i * 60, 240)}>
                  <Link to={`/blog/${post.slug}`} className="blog-card">
                    <div className="blog-card-cover">
                      {post.coverImageUrl ? (
                        <img src={post.coverImageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className="blog-card-cover-fallback" aria-hidden>
                          {post.title.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="blog-card-body">
                      {meta ? <p className="blog-card-meta">{meta}</p> : null}
                      <h2 className="blog-card-title">{post.title}</h2>
                      {post.excerpt ? <p className="blog-card-excerpt">{post.excerpt}</p> : null}
                      <span className="blog-card-more">
                        Read story <i className="bi bi-arrow-right" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        )}
      </section>

      <HomeFooter />
    </div>
  )
}
