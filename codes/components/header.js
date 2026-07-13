class header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<header>
  <a href="/UsefulTools/">UsefulTools</a>
</header>
    `;
  }
}

customElements.define('app-header', header);
