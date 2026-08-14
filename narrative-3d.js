import * as THREE from 'three';

const host = document.querySelector('#narrative-stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

try {
  if (!host) throw new Error('3D stage not found');

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020914, 0.046);

  const camera = new THREE.PerspectiveCamera(39, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 0, 12.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.25 : 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  host.appendChild(renderer.domElement);
  document.documentElement.classList.add('webgl-ready');

  const world = new THREE.Group();
  scene.add(world);

  const garmentGroup = new THREE.Group();
  const fragmentGroup = new THREE.Group();
  const dataGroup = new THREE.Group();
  const validationGroup = new THREE.Group();
  const outputGroup = new THREE.Group();
  const threadGroup = new THREE.Group();
  world.add(threadGroup, fragmentGroup, garmentGroup, dataGroup, validationGroup, outputGroup);

  function transparent(material, opacity = 1) {
    material.transparent = true;
    material.opacity = opacity;
    material.userData.baseOpacity = opacity;
    return material;
  }

  function rememberOpacity(root) {
    root.traverse((object) => {
      if (!object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        material.transparent = true;
        if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity;
      });
    });
  }

  function setOpacity(root, opacity) {
    root.visible = opacity > 0.015;
    root.traverse((object) => {
      if (!object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        const base = material.userData.baseOpacity ?? 1;
        material.opacity = base * opacity;
      });
    });
  }

  function garmentShape() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.46, 2.02);
    shape.bezierCurveTo(-0.87, 2.05, -1.18, 1.88, -1.7, 1.58);
    shape.lineTo(-2.22, 0.55);
    shape.lineTo(-1.6, 0.12);
    shape.lineTo(-1.17, 0.76);
    shape.lineTo(-1.02, -2.0);
    shape.quadraticCurveTo(0, -2.25, 1.02, -2.0);
    shape.lineTo(1.17, 0.76);
    shape.lineTo(1.6, 0.12);
    shape.lineTo(2.22, 0.55);
    shape.lineTo(1.7, 1.58);
    shape.bezierCurveTo(1.18, 1.88, 0.87, 2.05, 0.46, 2.02);
    shape.quadraticCurveTo(0, 1.42, -0.46, 2.02);
    shape.closePath();
    return shape;
  }

  const shapeGeometry = new THREE.ShapeGeometry(garmentShape(), 18);
  const clothMaterial = transparent(new THREE.MeshPhysicalMaterial({
    color: 0x123f63,
    roughness: 0.37,
    metalness: 0.22,
    clearcoat: 0.8,
    clearcoatRoughness: 0.25,
    emissive: 0x061a2b,
    emissiveIntensity: 0.92,
    side: THREE.DoubleSide,
    depthWrite: false
  }), 0.88);
  const garment = new THREE.Mesh(shapeGeometry, clothMaterial);
  garmentGroup.add(garment);

  [-0.13, 0.13].forEach((z, index) => {
    const lineMaterial = transparent(new THREE.LineBasicMaterial({ color: index ? 0xff6a00 : 0x55bfff }), index ? 0.72 : 0.48);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(shapeGeometry, 18), lineMaterial);
    edges.position.z = z;
    garmentGroup.add(edges);
  });

  const measureMaterial = transparent(new THREE.LineBasicMaterial({ color: 0x68c9ff }), 0.44);
  [
    [[-1.08, 0.92, 0.06], [1.08, 0.92, 0.06]],
    [[-1.03, -0.15, 0.06], [1.03, -0.15, 0.06]],
    [[0, 1.42, 0.06], [0, -2.02, 0.06]],
    [[-0.92, -1.55, 0.06], [0.92, -1.55, 0.06]]
  ].forEach((points) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
    garmentGroup.add(new THREE.Line(geometry, measureMaterial));
  });

  const seamDots = [];
  for (let i = 0; i < 13; i += 1) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(i === 6 ? 0.055 : 0.028, 8, 8),
      transparent(new THREE.MeshBasicMaterial({ color: i === 6 ? 0xff6a00 : 0x76ceff }), i === 6 ? 1 : 0.68)
    );
    dot.position.set(0, 1.34 - i * 0.25, 0.13);
    garmentGroup.add(dot);
    seamDots.push(dot);
  }

  function panelTexture(title, meta, accent = '#ff6a00') {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 360;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(4,16,30,.94)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(89,157,201,.55)';
    context.lineWidth = 3;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    context.fillStyle = accent;
    context.fillRect(42, 42, 8, 78);
    context.font = '600 22px Arial';
    context.fillStyle = '#7896ad';
    context.fillText('TECHLOOM / CONCEPTUAL SYSTEM VIEW', 76, 67);
    context.font = '600 49px Arial';
    context.fillStyle = '#f5f7f9';
    context.fillText(title, 76, 145);
    context.font = '400 27px Arial';
    context.fillStyle = '#89abc2';
    context.fillText(meta, 76, 208);
    context.strokeStyle = 'rgba(95,167,214,.33)';
    context.beginPath();
    context.moveTo(76, 262);
    context.lineTo(820, 262);
    context.stroke();
    context.font = '500 18px Arial';
    context.fillStyle = '#5f7f96';
    context.fillText('SOURCE  /  STATUS  /  REVISION  /  SCOPE', 76, 309);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function createPanel(title, meta, position, rotation = [0, 0, 0], accent) {
    const material = transparent(new THREE.MeshBasicMaterial({
      map: panelTexture(title, meta, accent),
      side: THREE.DoubleSide,
      depthWrite: false
    }), 0.92);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.28), material);
    panel.position.set(...position);
    panel.rotation.set(...rotation);
    return panel;
  }

  fragmentGroup.add(
    createPanel('SOURCE IMAGE', 'SOURCE PROVIDED', [-3.1, 1.85, -0.8], [0.08, 0.52, -0.08], '#55bfff'),
    createPanel('MATERIAL NOTE', 'MISSING ARTICLE DATA', [3.3, 1.28, -1.5], [-0.06, -0.62, 0.05]),
    createPanel('MEASUREMENT', 'CONFLICTING INPUT', [-3.15, -1.55, -1.1], [0.06, 0.46, 0.06]),
    createPanel('REVISION', 'SCOPE NOT RESOLVED', [3.25, -1.52, -0.2], [-0.05, -0.5, -0.04])
  );

  const dataNodes = [
    ['SOURCE', [-2.55, 1.75, 0.4]],
    ['STATUS', [2.55, 1.54, 0.25]],
    ['SCOPE', [-2.72, -1.3, 0.35]],
    ['REVISION', [2.68, -1.45, 0.45]]
  ];
  dataNodes.forEach(([label, position]) => {
    const node = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 20),
      transparent(new THREE.MeshBasicMaterial({ color: label === 'STATUS' ? 0xff6a00 : 0x63c5fb, side: THREE.DoubleSide }), 0.88)
    );
    node.position.set(...position);
    dataGroup.add(node);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...position), new THREE.Vector3(0, 0, 0.15)]),
      transparent(new THREE.LineBasicMaterial({ color: label === 'STATUS' ? 0xff6a00 : 0x4ca8df }), 0.42)
    );
    dataGroup.add(line);
  });
  dataGroup.add(createPanel('STRUCTURED RECORD', 'SOURCE + STATUS + APPLICABILITY', [0, -2.8, -0.2], [-0.18, 0, 0], '#55bfff'));

  const validationRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.025, 10, 120),
    transparent(new THREE.MeshBasicMaterial({ color: 0xff6a00 }), 0.92)
  );
  validationRing.rotation.x = 1.1;
  validationGroup.add(validationRing);
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.012, 8, 100),
    transparent(new THREE.MeshBasicMaterial({ color: 0x55bfff }), 0.56)
  );
  innerRing.rotation.set(1.25, 0.2, 0.3);
  validationGroup.add(innerRing);
  validationGroup.add(
    createPanel('AI PROPOSED', 'REQUIRES TECHNICAL REVIEW', [-2.8, 1.6, 0], [0, 0.35, -0.06], '#55bfff'),
    createPanel('DOMAIN CHECK', 'MISSING / CONFLICTING / DEPENDENT', [2.8, 0.1, -0.5], [0, -0.4, 0.04]),
    createPanel('EXPERT DECISION', 'AUTHORITY REMAINS HUMAN', [-2.4, -1.75, 0.35], [0, 0.3, 0.04])
  );

  const outputPanels = [
    createPanel('CONTROLLED RECORD', 'PLANNED WORKFLOW', [0, 0.8, 0], [-0.08, 0, 0], '#ff6a00'),
    createPanel('TECHNICAL MODULES', 'LINKED BY SCOPE + REVISION', [0.25, 0.05, -0.65], [-0.08, -0.04, 0], '#55bfff'),
    createPanel('RELEASE GATE', 'EXPERT VALIDATION REQUIRED', [0.5, -0.7, -1.3], [-0.08, -0.08, 0], '#ff6a00')
  ];
  outputPanels.forEach((panel) => outputGroup.add(panel));
  outputGroup.rotation.y = -0.18;

  for (let i = 0; i < 18; i += 1) {
    const points = [];
    const phase = (i / 18) * Math.PI * 2;
    for (let j = 0; j < 72; j += 1) {
      const t = j / 71;
      const radius = 2.8 + Math.sin(t * Math.PI * 2 + phase) * 0.28;
      points.push(new THREE.Vector3(
        Math.cos(phase + t * 5.8) * radius,
        -3.7 + t * 7.4,
        Math.sin(phase + t * 5.8) * radius * 0.42
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const isAccent = i % 5 === 0;
    const thread = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 100, isAccent ? 0.012 : 0.0045, 4, false),
      transparent(new THREE.MeshBasicMaterial({ color: isAccent ? 0xff6a00 : 0x3f9acb }), isAccent ? 0.7 : 0.22)
    );
    threadGroup.add(thread);
  }

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(2100 * 3);
  for (let i = 0; i < dustPositions.length; i += 3) {
    dustPositions[i] = (Math.random() - 0.5) * 22;
    dustPositions[i + 1] = (Math.random() - 0.5) * 13;
    dustPositions[i + 2] = (Math.random() - 0.5) * 13;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    transparent(new THREE.PointsMaterial({ color: 0x6cbbea, size: 0.018, depthWrite: false }), 0.48)
  );
  scene.add(dust);

  scene.add(new THREE.HemisphereLight(0x5ba9dd, 0x02050b, 2.25));
  const orangeLight = new THREE.PointLight(0xff5d15, 54, 13);
  orangeLight.position.set(4, 2, 5);
  scene.add(orangeLight);
  const blueLight = new THREE.PointLight(0x38a9ff, 70, 15);
  blueLight.position.set(-2.5, -2.5, 5);
  scene.add(blueLight);

  [garmentGroup, fragmentGroup, dataGroup, validationGroup, outputGroup, threadGroup].forEach(rememberOpacity);

  const states = [
    { x: 2.4, y: 0, z: -0.6, ry: -0.18, cameraZ: 12.2, garment: 0.94, fragments: 0.5, data: 0.14, validation: 0, output: 0, threads: 0.82 },
    { x: -2.15, y: 0.15, z: -1.3, ry: 0.28, cameraZ: 13.3, garment: 0.32, fragments: 1, data: 0.08, validation: 0, output: 0, threads: 0.48 },
    { x: 2.25, y: 0, z: -0.65, ry: -0.13, cameraZ: 12.2, garment: 0.9, fragments: 0.1, data: 1, validation: 0, output: 0, threads: 0.72 },
    { x: -2.05, y: 0, z: -1.15, ry: 0.16, cameraZ: 13, garment: 0.5, fragments: 0, data: 0.14, validation: 1, output: 0, threads: 0.6 },
    { x: 2.35, y: 0.15, z: -0.8, ry: -0.2, cameraZ: 12.5, garment: 0.26, fragments: 0, data: 0.08, validation: 0.08, output: 1, threads: 0.48 }
  ];

  let mouseX = 0;
  let mouseY = 0;
  let smoothedX = 0;
  let smoothedY = 0;
  let visible = true;
  let activeScene = 0;
  const clock = new THREE.Clock();

  addEventListener('pointermove', (event) => {
    mouseX = event.clientX / innerWidth - 0.5;
    mouseY = event.clientY / innerHeight - 0.5;
  }, { passive: true });

  addEventListener('techloom:scene', (event) => { activeScene = event.detail.index; });
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    document.documentElement.classList.remove('webgl-ready');
    document.documentElement.classList.add('no-webgl');
  });

  function mix(a, b, amount) { return a + (b - a) * amount; }

  function currentState() {
    const continuous = Number.isFinite(window.__techloomScroll) ? window.__techloomScroll : activeScene;
    const clamped = Math.max(0, Math.min(states.length - 1, continuous));
    const first = Math.floor(clamped);
    const second = Math.min(states.length - 1, first + 1);
    const amount = clamped - first;
    const state = {};
    Object.keys(states[first]).forEach((key) => { state[key] = mix(states[first][key], states[second][key], amount); });
    return state;
  }

  function animate() {
    if (!visible) {
      requestAnimationFrame(animate);
      return;
    }
    const time = clock.getElapsedTime();
    const state = currentState();
    smoothedX += (mouseX - smoothedX) * 0.025;
    smoothedY += (mouseY - smoothedY) * 0.025;
    const drift = reducedMotion ? 0 : Math.sin(time * 0.36) * 0.08;

    world.position.x += (state.x - world.position.x) * 0.055;
    world.position.y += (state.y + drift - world.position.y) * 0.055;
    world.position.z += (state.z - world.position.z) * 0.055;
    world.rotation.y += (state.ry + smoothedX * 0.18 - world.rotation.y) * 0.045;
    world.rotation.x += (-smoothedY * 0.07 - world.rotation.x) * 0.045;
    camera.position.z += (state.cameraZ - camera.position.z) * 0.04;
    camera.position.x += (smoothedX * 0.65 - camera.position.x) * 0.035;
    camera.position.y += (-smoothedY * 0.35 - camera.position.y) * 0.035;
    camera.lookAt(0, 0, 0);

    setOpacity(garmentGroup, state.garment);
    setOpacity(fragmentGroup, state.fragments);
    setOpacity(dataGroup, state.data);
    setOpacity(validationGroup, state.validation);
    setOpacity(outputGroup, state.output);
    setOpacity(threadGroup, state.threads);

    if (!reducedMotion) {
      threadGroup.rotation.y = time * 0.055;
      fragmentGroup.rotation.y = Math.sin(time * 0.27) * 0.05;
      validationRing.rotation.z = time * 0.08;
      innerRing.rotation.z = -time * 0.1;
      outputGroup.rotation.x = Math.sin(time * 0.42) * 0.025;
      dust.rotation.y = time * 0.008;
      seamDots.forEach((dot, index) => { dot.scale.setScalar(1 + Math.sin(time * 1.5 + index * 0.6) * 0.18); });
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function resize() {
    const width = innerWidth;
    const height = innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 760 ? 1.25 : 1.65));
  }
  addEventListener('resize', resize, { passive: true });
  animate();
} catch (error) {
  console.warn('Techloom 3D narrative fallback enabled.', error);
  document.documentElement.classList.remove('webgl-ready');
  document.documentElement.classList.add('no-webgl');
}
