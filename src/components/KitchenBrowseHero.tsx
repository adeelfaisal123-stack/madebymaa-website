interface KitchenBrowseHeroProps {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export function KitchenBrowseHero({
  search,
  onSearchChange,
  placeholder = 'Search kitchens, cuisines, chefs…',
}: KitchenBrowseHeroProps) {
  return (
    <section className="hp-hero hp-hero--kitchens">
      <div className="hp-hero-atmosphere" aria-hidden>
        <div className="hp-hero-wash" />
        <div className="hp-hero-glow hp-hero-glow--a" />
        <div className="hp-hero-glow hp-hero-glow--b" />
      </div>

      <div className="container position-relative">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 hp-hero-content kitchens-hero-copy">
            <p className="hp-brand">Made by Maa</p>
            <h1>
              All kitchens,
              <em> close to home</em>
            </h1>
            <p className="hp-hero-lead kitchens-hero-lead">
              Meet verified home chefs crafting authentic meals with care — right in your
              neighbourhood.
            </p>

            <div className="hp-hero-search kitchens-hero-search">
              <div className="hp-search-field kitchens-hero-search-field">
                <i className="bi bi-search hp-search-leading" aria-hidden />
                <input
                  type="search"
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label={placeholder}
                />
                {search ? (
                  <button
                    type="button"
                    className="hp-search-clear"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                ) : (
                  <span className="hp-search-submit kitchens-hero-search-icon" aria-hidden>
                    <i className="bi bi-shop" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6 hp-hero-visual">
            <div className="hp-hero-portrait">
              <span className="hp-hero-portrait-ring" aria-hidden />
              <span className="hp-hero-portrait-halo" aria-hidden />
              <div className="hp-hero-portrait-frame">
                <img
                  src="/images/cartoons/cartoon-all-kitchens.png?v=2"
                  alt="All kitchens — Made by Maa"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
