import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBlogPost } from '../api/optica2'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
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
    month: 'long',
    day: 'numeric',
  })
}

function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text)
}

function BlogBody({ body }: { body: string }) {
  const html = useMemo(() => looksLikeHtml(body), [body])

  if (html) {
    return (
      <div
        className="blog-article-body"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    )
  }

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="blog-article-body blog-article-plain">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

export function BlogDetailPage() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('Story not found.')
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setPost(null)
      try {
        const data = await fetchBlogPost(slug)
        if (!cancelled) setPost(data)
      } catch {
        if (!cancelled) setError('This story could not be found or is no longer published.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const meta = post
    ? [post.authorName, formatBlogDate(post.publishedAt)].filter(Boolean).join(' · ')
    : ''

  return (
    <div className="homepage blog-page">
      <HomeNav active="blog" />

      {loading ? (
        <section className="blog-section">
          <div className="blog-state" role="status">
            <div className="blog-spinner" aria-hidden />
            <p>Loading story…</p>
          </div>
        </section>
      ) : error || !post ? (
        <section className="blog-section">
          <div className="blog-empty">
            <h2>Story not found</h2>
            <p>{error ?? 'This post is unavailable.'}</p>
            <Link to="/blog" className="hp-btn hp-btn--primary" style={{ marginTop: 20 }}>
              Back to blog
            </Link>
          </div>
        </section>
      ) : (
        <>
          <header className="blog-detail-hero">
            <div
              className={`blog-detail-hero-media${post.coverImageUrl ? '' : ' blog-detail-hero-media--plain'}`}
            >
              {post.coverImageUrl ? (
                <img src={post.coverImageUrl} alt="" />
              ) : null}
              <div className="blog-detail-hero-shade" aria-hidden />
            </div>
            <div className="blog-detail-hero-inner">
              <Link to="/blog" className="blog-detail-back">
                <i className="bi bi-arrow-left" aria-hidden /> All stories
              </Link>
              {meta ? <p className="blog-detail-meta">{meta}</p> : null}
              <h1>{post.title}</h1>
              {post.excerpt ? <p className="blog-detail-excerpt">{post.excerpt}</p> : null}
            </div>
          </header>

          <article className="blog-article">
            {post.body ? <BlogBody body={post.body} /> : null}
            <div className="blog-article-foot">
              <Link to="/blog" className="hp-btn hp-btn--ghost hp-btn--sm">
                More stories
              </Link>
              <Link to="/kitchens" className="hp-btn hp-btn--primary hp-btn--sm">
                Explore kitchens
              </Link>
            </div>
          </article>
        </>
      )}

      <HomeFooter />
    </div>
  )
}
