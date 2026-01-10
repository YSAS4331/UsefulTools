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
    background: 'rgba(0,0,0,0.75)',
    zIndex: '9999'
  });
  Object.assign(dialogDiv.style, {
    display: display,
    borderRadius: 'var(--radius)',
    border: '2px var(--accent) solid',
    zIndex: '10000',
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%,-50%)'
  });

  bg.appendChild(dialogDiv);
  document.body.appendChild(bg);

  function remove() {
    bg.remove();
  }
  
  return { dialogDiv, remove };
}

export default $;
