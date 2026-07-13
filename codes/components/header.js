class header extends HTMLElement {
  constructor() {
    super();
    
    this.attachShadow({ mode: 'open' });
  }
  
  #render() {
    this.innerHTML = `
<style>
:host {
  display: block;
}
</style>
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
