const motionAllowed =
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !window.matchMedia('(max-width: 900px)').matches;

if (motionAllowed) {
  const haze = document.createElement('div');
  haze.className = 'depth-haze';
  document.body.appendChild(haze);

  // Keep depth motion away from edge-bound metrics and feature cards.
  const floats = [
    ...document.querySelectorAll(
      '.section-head > *, .workflow li, .testimonial, .pill-row span, .cta'
    ),
  ];

  floats.forEach((element, index) => {
    element.classList.add('float-3d');
    element.dataset.depth = String(10 + (index % 5) * 12);
  });

  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
    haze.style.setProperty('--hx', `${event.clientX}px`);
    haze.style.setProperty('--hy', `${event.clientY}px`);
  });

  function floatLoop(time) {
    floats.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const visible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (!visible) return;

      const depth = Number(element.dataset.depth);
      const center =
        (rect.top + rect.height / 2 - window.innerHeight / 2) /
        window.innerHeight;
      const lift = Math.sin(time * 0.0007 + index) * 5;
      const rotateX = -mouseY * (1 + depth / 40);
      const rotateY = mouseX * (1 + depth / 35);
      const translateZ =
        depth * (1 - Math.min(1, Math.abs(center)));

      element.style.transform =
        `translate3d(${mouseX * depth * 0.22}px,${lift - center * depth * 0.35}px,${translateZ}px) ` +
        `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    window.requestAnimationFrame(floatLoop);
  }

  window.requestAnimationFrame(floatLoop);
} else {
  document.documentElement.classList.add('reduced-immersion');
}
