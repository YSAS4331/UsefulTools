class CustomSeg extends HTMLElement {
  static get observedAttributes() { return ['value']; }

  get value() { return this.getAttribute('value'); }
  set value(v) { this.setAttribute('value', v); }

  connectedCallback() {
    this.spans = Array.from(this.querySelectorAll('span'));
    this.count = this.spans.length;
    if (this.count === 0) return;

    /* create highlight element if not exists */
    if (!this.highlight) {
      this.highlight = document.createElement('div');
      this.highlight.className = 'highlight';
      this.appendChild(this.highlight);
    }

    this.highlight.style.width = `${100 / this.count}%`;

    /* sync initial state */
    const initial = this.getAttribute('value');
    this.select(initial !== null ? Number(initial) : 0, false);

    this.spans.forEach((span, index) => {
      span.onclick = () => this.select(index, true);
    });
  }

  attributeChangedCallback(name, oldV, newV) {
    /* skip if value is same or spans not ready */
    if (name === 'value' && this.spans && oldV !== newV) {
      this.select(Number(newV), false);
    }
  }

  select(index, emit = true) {
    if (index < 0 || index >= this.count) return;

    /* update visual state */
    this.highlight.style.transform = `translateX(${index * 100}%)`;

    /* update attribute only if different to prevent loop */
    if (Number(this.getAttribute('value')) !== index) {
      this.setAttribute('value', index);
    }

    if (emit) {
      this.dispatchEvent(new CustomEvent('change', {
        detail: { 
          value: this.spans[index].textContent.trim(), 
          index 
        }
      }));
    }
  }
}

customElements.define('custom-seg', CustomSeg);
