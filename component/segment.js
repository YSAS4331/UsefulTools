class Seg extends HTMLElement {
  connectedCallback() {
    this.spans = Array.from(this.querySelectorAll('span'))
    this.count = this.spans.length

    // highlight を Light DOM に追加
    this.highlight = document.createElement('div')
    this.highlight.className = 'highlight'
    this.appendChild(this.highlight)

    // 幅設定
    this.segmentWidth = 100 / this.count
    this.highlight.style.width = `${this.segmentWidth}%`

    // 初期選択
    this.select(0)

    // クリックイベント
    this.spans.forEach((span, index) => {
      span.addEventListener('click', () => this.select(index))
    })
  }

  select(index) {
    this.highlight.style.transform = `translateX(${index * 100}%)`

    const value = this.spans[index].textContent.trim()

    this.dispatchEvent(new CustomEvent('change', {
      detail: { value, index }
    }))
  }
}

customElements.define('custom-seg', Seg);
