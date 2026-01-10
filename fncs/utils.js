function $(s,r=document) {
  return r.querySelector(s);
}
$.$ = (s,r=document) => [...r.querySelectorAll(s)];
$.create = e => document.createElement(e);
$.dialog = (display='flex') => {
  const bg = $.create('div');
  const dialogDiv = $.create('div');

  Object.assign(bg.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.35)',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  Object.assign(dialogDiv.style, {
    background: 'var(--bg)',
    display: display,
    minWidth: '50%',
    minHeight: '50%',
    width: 'min(40vh, 40vw)',
    height: 'auto',
    aspectRatio: '1/1',
    borderRadius: 'var(--radius)',
    border: '4px var(--accent) solid',
    zIndex: '10000',
    transform: 'scale(.75)',
    transition: 'transform .5s ease, opacity .5s ease',
    opacity: '0'
  });

  bg.appendChild(dialogDiv);
  document.body.appendChild(bg);
  requestAnimationFrame(() => {
    dialogDiv.style.opacity = '1';
    dialogDiv.style.transform = 'scale(1)';
  });

  function remove() {
    requestAnimationFrame(() => {
      dialogDiv.style.opacity = '0';
      dialogDiv.style.transform = 'scale(.75)';
    });
    dialogDiv.addEventListener('transitionend', () => bg.remove(), { once: true });
  }
  
  bg.addEventListener('click', e => {
    if (e.target === bg) remove();
  });
  
  return { dialogDiv, remove };
}

export default $;
