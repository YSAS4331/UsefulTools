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
          height: max-content;
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
          background: var(--accent, #6366f1);
          border-radius: 2px;
          transition: transform .25s ease, height .25s ease;
          will-change: transform, height;
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

    this.assignIds()
    this.build()
    this.observe()
  }

  assignIds() {
    let count = 1
    this.sections.forEach(section => {
      if (!section.id) {
        section.id = `section-h2-${count++}`
      }
    })
  }

  build() {
    this.sections.forEach((section, i) => {
      const h2 = section.querySelector('h2')

      const li = document.createElement('li')
      const a = document.createElement('a')

      a.href = `#${section.id}`
      a.textContent = h2.textContent
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

  updateHighlight(activeItems) {
    if (activeItems.length === 0) return

    const rects = activeItems.map(i =>
      i.a.getBoundingClientRect()
    )

    const navRect = this.list.getBoundingClientRect()

    const top = Math.min(...rects.map(r => r.top))
    const bottom = Math.max(...rects.map(r => r.bottom))

    this.highlight.style.transform =
      `translateY(${top - navRect.top}px)`

    this.highlight.style.height =
      `${bottom - top}px`
  }

  observe() {
    const visible = new Set()

    const io = new IntersectionObserver(
      entries => {
        let changed = false

        entries.forEach(entry => {
          const item = this.items.find(
            i => i.section === entry.target
          )
          if (!item) return

          if (entry.isIntersecting) {
            visible.add(item)
            item.a.setAttribute('aria-current', 'location')
          } else {
            visible.delete(item)
            item.a.removeAttribute('aria-current')
          }

          changed = true
        })

        if (changed) {
          this.updateHighlight([...visible])
        }
      },
      {
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0
      }
    )

    this.items.forEach(i => io.observe(i.section))
  }
}

customElements.define('com-nav', ComNav)
