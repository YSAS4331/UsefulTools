function $(s, r = document) {
  return r.querySelector(s);
}
$.$ = (s, r = document) => [...r.querySelectorAll(s)];
$.create = e => document.createElement(e);

$.dialog = () => {
  const bg = $.create('div');
  const dialogDiv = $.create('div');
  const closeBtn = $.create('span');
  const content = $.create('div');

  // Close button
  closeBtn.className = 'material-symbols-outlined';
  closeBtn.textContent = 'close';
  closeBtn.style.marginLeft = 'auto';
  closeBtn.style.cursor = 'pointer';

  // Background
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

  // Dialog (高さ固定)
  Object.assign(dialogDiv.style, {
    background: 'radial-gradient(var(--bgDot) 0.25px, var(--bg) 1px)',
    backgroundSize: '22px 22px',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    width: 'min(40vh, 40vw)',
    height: 'auto',
    aspectRatio: '1/1',
    minWidth: '50vw',
    minHeight: '50vh',
    borderRadius: 'var(--radius)',
    border: '4px var(--accent) solid',
    transform: 'scale(.75)',
    transition: 'transform .5s ease, opacity .5s ease',
    opacity: '0',
    overflow: 'hidden'           // content がはみ出さないように
  });

  // Content（内部スクロール）
  Object.assign(content.style, {
    flex: '1',
    overflowY: 'auto',
    paddingRight: '4px'
  });

  // Build structure
  dialogDiv.appendChild(closeBtn);
  dialogDiv.appendChild(content);
  bg.appendChild(dialogDiv);
  document.body.appendChild(bg);

  // Animate in
  requestAnimationFrame(() => {
    dialogDiv.style.opacity = '1';
    dialogDiv.style.transform = 'scale(1)';
  });

  // Remove function
  function remove() {
    requestAnimationFrame(() => {
      dialogDiv.style.opacity = '0';
      dialogDiv.style.transform = 'scale(.75)';
    });
    dialogDiv.addEventListener('transitionend', () => bg.remove(), { once: true });
  }

  // Close on background click
  bg.addEventListener('click', e => {
    if (e.target === bg) remove();
  });

  // Close button
  closeBtn.addEventListener('click', remove);

  return { content, remove };
};

export default $;
