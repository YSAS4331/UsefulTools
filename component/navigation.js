class ComNav extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 220px;
          font-family: system-ui, sans-serif;
        }
        nav {
          position: relative;
        }
        ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        a {
          display: block;
          padding: 8px 12px;
          color: inherit;
          text-decoration: none;
          outline-offset: 2px;
        }
        a[aria-current="location"] {
          font-weight: 600;
        }
        .highlight {
          position: absolute;
          left: 0;
          width: 4px;
          background: var(--accent);
          border-radius: 2px;
          transition: transform .25s ease, height .25s ease;
        }
      </style>

      <nav aria-label="Section navigation">
        <div class="highlight" aria-hidden="true"></div>
        <ul role="list"></ul>
      </nav>
    `
  }

  connectedCallback() {
    this.list = this.shadowRoot.querySelector('ul')
    this.highlight = this.shadowRoot.querySelector('.highlight')

    this.sections = [...document.querySelectorAll('section')]
      .filter(s => s.querySelector('h2'))

    this.items = []

    this.build()
    this.observe()
  }

  build() {
    this.sections.forEach((section, i) => {
      const h2 = section.querySelector('h2')

      if (!section.id) {
        section.id = `section-${i}`
      }

      const li = document.createElement('li')
      const a = document.createElement('a')

      a.href = `#${section.id}`
      a.textContent = h2.textContent
      a.setAttribute('role', 'link')
      a.tabIndex = 0

      a.addEventListener('click', e => {
        e.preventDefault()
        section.scrollIntoView({ behavior: 'smooth' })
      })

      a.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          a.click()
        }

        if (e.key === 'ArrowDown') {
          this.items[i + 1]?.a.focus()
        }

        if (e.key === 'ArrowUp') {
          this.items[i - 1]?.a.focus()
        }
      })

      li.append(a)
      this.list.append(li)

      this.items.push({ section, a })
    })
  }

  moveHighlight(a) {
    const aRect = a.getBoundingClientRect()
    const navRect = this.list.getBoundingClientRect()

    this.highlight.style.height = `${aRect.height}px`
    this.highlight.style.transform =
      `translateY(${aRect.top - navRect.top}px)`
  }

  setCurrent(target) {
    this.items.forEach(i => {
      i.a.removeAttribute('aria-current')
    })

    target.a.setAttribute('aria-current', 'location')
    this.moveHighlight(target.a)
  }

  observe() {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return

          const item = this.items.find(
            i => i.section === entry.target
          )

          if (item) this.setCurrent(item)
        })
      },
      {
        rootMargin: '-40% 0px -50% 0px'
      }
    )

    this.items.forEach(i => io.observe(i.section))

    requestAnimationFrame(() => {
      if (this.items[0]) this.setCurrent(this.items[0])
    })
  }
}

customElements.define('com-nav', ComNav)

