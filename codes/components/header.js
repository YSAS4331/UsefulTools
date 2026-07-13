class header extends HTMLElement {
  constructor() {
    super();
    
    this.attachShadow({ mode: 'open' });
  }
  
  #render() {
    this.innerHTML = `
<header>
  <a href="/UsefulTools/">UsefulTools</a>
</header>
    `;
  }
  
  connectedCallback() {
    this.#render();
  }
}

customElements.define('app-header', header);
