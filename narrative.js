(() => {
  const body = document.body;
  const nav = document.querySelector('.site-nav');
  const menu = document.querySelector('.menu-button');
  const links = document.querySelector('#nav-links');
  const narrative = document.querySelector('.narrative');
  const chapters = [...document.querySelectorAll('.chapter')];
  const progress = [...document.querySelectorAll('.chapter-progress span')];
  const sceneNumber = document.querySelector('.scene-name span');
  const sceneLabel = document.querySelector('.scene-name strong');
  const labels = ['PRODUCT INPUT', 'THE PRODUCTION GAP', 'STRUCTURED DATA', 'CONTROLLED VALIDATION', 'PRODUCT RECORD'];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeScene = -1;
  let ticking = false;

  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
  }

  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  function setScene(index) {
    if (index === activeScene || index < 0 || index >= chapters.length) return;
    activeScene = index;
    body.dataset.scene = String(index);
    chapters.forEach((chapter, i) => chapter.classList.toggle('is-active', i === index));
    progress.forEach((item, i) => item.classList.toggle('is-active', i === index));
    sceneNumber.textContent = String(index + 1).padStart(2, '0');
    sceneLabel.textContent = labels[index];
    window.dispatchEvent(new CustomEvent('techloom:scene', { detail: { index } }));
  }

  function update() {
    ticking = false;
    const scrollTop = window.scrollY;
    const rect = narrative.getBoundingClientRect();
    const total = Math.max(1, narrative.offsetHeight - innerHeight);
    const local = Math.min(1, Math.max(0, -rect.top / total));
    const continuousScene = local * (chapters.length - 1);
    window.__techloomScroll = continuousScene;
    document.documentElement.style.setProperty('--story-progress', local.toFixed(4));
    nav.classList.toggle('is-scrolled', scrollTop > 24);
    body.classList.toggle('is-scrolled', scrollTop > innerHeight * 0.08);

    const probe = innerHeight * 0.5;
    let nearest = 0;
    let distance = Infinity;
    chapters.forEach((chapter, i) => {
      const chapterRect = chapter.getBoundingClientRect();
      const center = chapterRect.top + chapterRect.height / 2;
      const nextDistance = Math.abs(center - probe);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = i;
      }
    });
    setScene(nearest);
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate, { passive: true });
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  if (!reduceMotion) {
    addEventListener('pointermove', (event) => {
      document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
    }, { passive: true });
  }

  body.classList.add('is-loaded');
  setScene(0);
  update();
})();
