class CustomSeg extends HTMLElement {
  static get observedAttributes() {
    return ['value']
  }

  connectedCallback() {
    this.spans = Array.from(this.querySelectorAll('span'))
    this.count = this.spans.length

    // highlight を追加
    this.highlight = document.createElement('div')
    this.highlight.className = 'highlight'
    this.appendChild(this.highlight)

    // 幅設定
    this.segmentWidth = 100 / this.count
    this.highlight.style.width = `${this.segmentWidth}%`

    // 初期選択（属性 value があれば使う）
    const initial = Number(this.getAttribute('value') ?? 0)
    this.select(initial, false)

    // クリックイベント
    this.spans.forEach((span, index) => {
      span.addEventListener('click', () => this.select(index, true))
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && this.spans) {
      this.select(Number(newValue), false)
    }
  }

  select(index, emit = true) {
    if (index < 0 || index >= this.count) return

    this.highlight.style.transform = `translateX(${index * 100}%)`

    const value = this.spans[index].textContent.trim()

    // 属性 value を同期
    this.setAttribute('value', index)

    if (emit) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value, index }
      }))
    }
  }
}

customElements.define('custom-seg', CustomSeg)
