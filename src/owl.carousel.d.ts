import 'jquery'

declare module 'jquery' {
  interface JQuery {
    owlCarousel(options?: Record<string, unknown>): JQuery
    trigger(event: 'destroy.owl.carousel'): JQuery
  }
}

declare module 'owl.carousel'
