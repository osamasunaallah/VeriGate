
/* VeriGate — built from src/*.jsx by tools/build-verigate (Babel, preset react). Do not edit by hand. */

/* ---- DeviceWithLCD ---- */
(function(){
function DeviceWithLCD({
  activeChapter = 0,
  chapters = [],
  rotation,
  className = ''
}) {
  const mountRef = React.useRef(null);
  const stateRef = React.useRef({});
  const propsRef = React.useRef({
    activeChapter,
    chapters,
    rotation
  });
  React.useEffect(() => {
    propsRef.current = {
      activeChapter,
      chapters,
      rotation
    };
  }, [activeChapter, chapters, rotation]);
  React.useEffect(() => {
    let alive = true;
    let raf = 0;
    const start = () => {
      const THREE = window.THREE;
      const GLTFLoader = window.GLTFLoader;
      if (!THREE || !GLTFLoader || !mountRef.current) {
        return;
      }
      const mount = mountRef.current;
      const initialW = Math.max(mount.clientWidth, 200);
      const initialH = Math.max(mount.clientHeight, 200);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, initialW / initialH, 0.001, 50);
      camera.position.set(0.18, 0.04, 0.20);
      camera.lookAt(0, 0, 0);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(initialW, initialH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambient);
      const key = new THREE.DirectionalLight(0xfff2dc, 2.4);
      key.position.set(0.5, 0.45, 0.45);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xcbd3ff, 0.9);
      fill.position.set(-0.45, 0.20, 0.30);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xb0c0ff, 1.4);
      rim.position.set(-0.10, 0.35, -0.50);
      scene.add(rim);
      const LCD_W = 1024,
        LCD_H = 220;
      const lcdCanvas = document.createElement('canvas');
      lcdCanvas.width = LCD_W;
      lcdCanvas.height = LCD_H;
      const lcdCtx = lcdCanvas.getContext('2d');
      const lcdTexture = new THREE.CanvasTexture(lcdCanvas);
      if (THREE.SRGBColorSpace) lcdTexture.colorSpace = THREE.SRGBColorSpace;
      lcdTexture.flipY = true;
      lcdTexture.anisotropy = 8;
      lcdTexture.minFilter = THREE.LinearFilter;
      lcdTexture.magFilter = THREE.LinearFilter;
      let lcdMesh = null;
      let model = null;
      const loader = new GLTFLoader();
      loader.load('./verigate-device.glb?v=21', gltf => {
        if (!alive) return;
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetMax = 0.10;
        const fitScale = targetMax / maxDim;
        model.scale.setScalar(fitScale);
        model.traverse(obj => {
          if (!obj.isMesh) return;
          if (obj.name === 'LCD_Screen_Plane') {
            lcdMesh = obj;
            const lcdMat = new THREE.MeshBasicMaterial({
              map: lcdTexture,
              toneMapped: false,
              transparent: false
            });
            lcdMesh.material = lcdMat;
          }
        });
        scene.add(model);
        stateRef.current.model = model;
        stateRef.current.lcdMesh = lcdMesh;
      }, undefined, err => {
        console.error('GLB load error:', err);
      });
      const onResize = () => {
        const w = Math.max(mount.clientWidth, 200);
        const h = Math.max(mount.clientHeight, 200);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      let resizeObs = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObs = new ResizeObserver(onResize);
        resizeObs.observe(mount);
      }
      let dragging = false;
      let dragStartX = 0,
        dragStartY = 0;
      let dragYaw = 0,
        dragPitch = 0;
      let dragYawT = 0,
        dragPitchT = 0;
      let savedYaw = 0,
        savedPitch = 0;
      const onPointerDown = e => {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        savedYaw = dragYaw;
        savedPitch = dragPitch;
        try {
          renderer.domElement.setPointerCapture(e.pointerId);
        } catch (_) {}
      };
      const onPointerMove = e => {
        if (!dragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        dragYawT = savedYaw + Math.max(-1.6, Math.min(1.6, dx * 0.005));
        dragPitchT = savedPitch + Math.max(-0.8, Math.min(0.8, dy * 0.004));
      };
      const onPointerUp = () => {
        if (!dragging) return;
        dragging = false;
        dragYawT = 0;
        dragPitchT = 0;
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      let lastLcdTime = 0;
      let lastChapterIdx = -1;
      const LCD_INTERVAL = 1000 / 20;
      let onScreen = true;
      const vis = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
      }, {
        rootMargin: '80px'
      }) : null;
      if (vis) vis.observe(mount);
      stateRef.current.vis = vis;
      const animate = t => {
        if (!alive) return;
        raf = requestAnimationFrame(animate);
        if (!onScreen || document.hidden) return;
        const tMs = t || performance.now();
        const {
          activeChapter,
          chapters,
          rotation
        } = propsRef.current;
        const chap = chapters && chapters.length ? chapters[Math.max(0, Math.min(chapters.length - 1, activeChapter))] : {};
        const chapterChanged = activeChapter !== lastChapterIdx;
        if (chapterChanged || tMs - lastLcdTime > LCD_INTERVAL) {
          drawLCD(lcdCtx, lcdCanvas, chap, tMs);
          lcdTexture.needsUpdate = true;
          lastLcdTime = tMs;
          lastChapterIdx = activeChapter;
        }
        if (model) {
          dragYaw += (dragYawT - dragYaw) * 0.16;
          dragPitch += (dragPitchT - dragPitch) * 0.16;
          const idle = Math.sin(tMs * 0.0005) * 0.08;
          const baseY = rotation && typeof rotation.y === 'number' ? rotation.y : 0;
          const baseX = rotation && typeof rotation.x === 'number' ? rotation.x : 0;
          model.rotation.y = baseY + idle + dragYaw;
          model.rotation.x = baseX + dragPitch * 0.6;
          model.position.y = Math.sin(tMs * 0.0009) * 0.0025;
        }
        renderer.render(scene, camera);
      };
      animate(0);
      stateRef.current = {
        ...stateRef.current,
        renderer,
        scene,
        camera,
        lcdCanvas,
        lcdCtx,
        lcdTexture,
        onResize,
        resizeObs,
        onPointerDown,
        onPointerMove,
        onPointerUp
      };
    };
    if (window.__threeReady) start();else window.addEventListener('threeready', start, {
      once: true
    });
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      const s = stateRef.current;
      if (s.onResize) window.removeEventListener('resize', s.onResize);
      if (s.resizeObs) s.resizeObs.disconnect();
      if (s.vis) s.vis.disconnect();
      if (s.renderer) {
        if (s.onPointerDown) s.renderer.domElement.removeEventListener('pointerdown', s.onPointerDown);
        s.renderer.dispose();
        if (s.renderer.domElement.parentNode) {
          s.renderer.domElement.parentNode.removeChild(s.renderer.domElement);
        }
      }
      if (s.onPointerMove) window.removeEventListener('pointermove', s.onPointerMove);
      if (s.onPointerUp) {
        window.removeEventListener('pointerup', s.onPointerUp);
        window.removeEventListener('pointercancel', s.onPointerUp);
      }
      if (s.lcdTexture) s.lcdTexture.dispose();
      if (s.scene) {
        s.scene.traverse(obj => {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());else obj.material.dispose && obj.material.dispose();
            }
          }
        });
      }
    };
  }, []);
  return React.createElement("div", {
    ref: mountRef,
    className: 'dwl-mount ' + (className || ''),
    style: {
      width: '100%',
      height: '100%',
      touchAction: 'pan-y',
      cursor: 'grab'
    }
  });
}
function drawLCD(ctx, canvas, chap, time) {
  const w = canvas.width,
    h = canvas.height;
  const isApproved = chap && chap.state === 'approved';
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 50, w * 0.5, h * 0.35, w * 0.7);
  if (isApproved) {
    bg.addColorStop(0.00, '#2DD279');
    bg.addColorStop(0.30, '#1aa05a');
    bg.addColorStop(0.65, '#0d6e3a');
    bg.addColorStop(1.00, '#094a27');
  } else {
    bg.addColorStop(0.00, '#2A52BE');
    bg.addColorStop(0.30, '#1f3f9e');
    bg.addColorStop(0.65, '#142a72');
    bg.addColorStop(1.00, '#0c1e5a');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1);
  for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 1, h);
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.40);
  top.addColorStop(0, 'rgba(255,255,255,0.14)');
  top.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.40);
  const line1 = chap && chap.lcdLine1 || 'VERIGATE';
  const line2 = chap && chap.lcdLine2 || 'READY · SCAN';
  const cursorOn = Math.floor(time / 500) % 2 === 0;
  const cursor = cursorOn ? '_' : ' ';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 90px "JetBrains Mono", "Menlo", "Consolas", monospace';
  ctx.shadowColor = isApproved ? 'rgba(170,255,200,0.9)' : 'rgba(170,210,255,0.9)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = isApproved ? '#E8FFEF' : '#E0EBFF';
  ctx.fillText(line1 + cursor, w / 2, h * 0.36);
  ctx.font = '600 56px "JetBrains Mono", "Menlo", "Consolas", monospace';
  ctx.shadowBlur = 18;
  ctx.fillStyle = isApproved ? '#C8F5DA' : '#B5CDFF';
  ctx.fillText(line2, w / 2, h * 0.74);
  const period = 2800;
  const beamH = 70;
  const beamY = time % period / period * (h + beamH) - beamH;
  ctx.shadowBlur = 0;
  const beam = ctx.createLinearGradient(0, beamY, 0, beamY + beamH);
  beam.addColorStop(0, 'rgba(255,255,255,0)');
  beam.addColorStop(0.5, isApproved ? 'rgba(180,255,200,0.28)' : 'rgba(180,210,255,0.28)');
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, beamY, w, beamH);
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.30, w * 0.5, h * 0.5, w * 0.55);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}
window.DeviceWithLCD = DeviceWithLCD;
window.drawLCD = drawLCD;
})();

/* ---- PhoenixIntro ---- */
(function(){
const INTRO_DURATION_MS = 5200;
const SETTLE_DURATION_MS = 600;
const SESSION_KEY = 'verigate_intro_played';
const FORCE_REPLAY = typeof location !== 'undefined' && location.search.indexOf('intro=1') >= 0;
function PhoenixIntro({
  onDone
}) {
  const hostRef = React.useRef(null);
  const fallbackRef = React.useRef(null);
  const [phase, setPhase] = React.useState('init');
  const [usingFallback, setUsingFallback] = React.useState(false);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone && onDone();
      return;
    }
    try {
      if (!FORCE_REPLAY && sessionStorage.getItem(SESSION_KEY)) {
        onDone && onDone();
        return;
      }
    } catch (_) {}
    if (window.__phxIntroRunning) {
      onDone && onDone();
      return;
    }
    window.__phxIntroRunning = true;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (_) {}
    let alive = true;
    let raf = 0;
    let renderer, scene, camera, model, mixer, clock;
    let threeFailed = false;
    let threeFailTimer = setTimeout(() => {
      if (alive && !window.__threeReady) {
        threeFailed = true;
        setUsingFallback(true);
      }
    }, 900);
    const finish = () => {
      if (!alive) return;
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (scene) {
        scene.traverse(obj => {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              const m = Array.isArray(obj.material) ? obj.material : [obj.material];
              m.forEach(mm => {
                Object.values(mm).forEach(v => {
                  if (v && v.isTexture) v.dispose();
                });
                mm.dispose && mm.dispose();
              });
            }
          }
        });
      }
      setPhase('done');
      window.__phxIntroRunning = false;
      onDone && onDone();
    };
    const startThreeIntro = () => {
      if (!alive || threeFailed) return;
      clearTimeout(threeFailTimer);
      const THREE = window.THREE;
      const GLTFLoader = window.GLTFLoader;
      const host = hostRef.current;
      if (!THREE || !GLTFLoader || !host) {
        setUsingFallback(true);
        return;
      }
      const W = window.innerWidth;
      const H = window.innerHeight;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(35, W / H, 0.01, 100);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .35s ease-out;';
      host.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const key = new THREE.DirectionalLight(0xfff0d8, 1.6);
      key.position.set(2, 2, 3);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xa8b5ff, 0.8);
      rim.position.set(-2, 1, -1);
      scene.add(rim);
      clock = new THREE.Clock();
      const loader = new GLTFLoader();
      let startedAt = 0;
      const giveUp = setTimeout(() => {
        if (alive && !startedAt) finish();
      }, 4500);
      loader.load('./phoenix-bird.glb?v=40', gltf => {
        if (!alive) return;
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitScale = 2.6 / maxDim;
        model.userData.fitScale = fitScale;
        model.scale.setScalar(fitScale);
        const ctr = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        model.position.sub(ctr);
        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          const fullClip = gltf.animations[0];
          const PATHS = [[0, 96, -7.5, -1.2, 7.5, -1.2, 0.22, 'L→R level'], [96, 192, 7.5, -1.0, -7.5, -1.0, Math.PI - 0.22, 'R→L level'], [192, 288, -7.5, -1.6, 7.5, -0.5, 0.22, 'L→R climb'], [288, 384, 7.5, -0.5, -7.5, -1.6, Math.PI - 0.22, 'R→L dive']];
          const picked = PATHS[Math.floor(Math.random() * PATHS.length)];
          const sFrame = picked[0],
            eFrame = picked[1];
          const subClip = THREE.AnimationUtils.subclip(fullClip, picked[7], sFrame, eFrame, 24);
          const action = mixer.clipAction(subClip);
          action.loop = THREE.LoopRepeat;
          action.timeScale = subClip.duration / (INTRO_DURATION_MS / 1000);
          action.play();
          model.userData.path = {
            sx: picked[2],
            sy: picked[3],
            ex: picked[4],
            ey: picked[5],
            rotY: picked[6],
            label: picked[7]
          };
        }
        scene.add(model);
        clearTimeout(giveUp);
        if (!alive) return;
        renderer.compile(scene, camera);
        renderer.render(scene, camera);
        startedAt = performance.now();
        clock.getDelta();
        renderer.domElement.style.opacity = '1';
        setPhase('flying');
      }, undefined, err => {
        console.error('[PhoenixIntro] GLB load FAILED', err);
        if (alive) {
          threeFailed = true;
          setUsingFallback(true);
        }
      });
      const animate = () => {
        if (!alive) return;
        raf = requestAnimationFrame(animate);
        if (!startedAt) return;
        const now = performance.now();
        const t = Math.min(1, (now - startedAt) / INTRO_DURATION_MS);
        const settleT = Math.max(0, (now - startedAt - (INTRO_DURATION_MS - SETTLE_DURATION_MS)) / SETTLE_DURATION_MS);
        if (mixer) mixer.update(Math.min(clock.getDelta(), 1 / 30));
        if (model) {
          const e = easeOutSine(t);
          const p = model.userData.path || {
            sx: -7,
            sy: -0.5,
            ex: 7,
            ey: -0.5,
            rotY: 0.22
          };
          const zFloat = Math.sin(t * Math.PI * 1.0) * 0.15;
          const yBob = Math.sin(t * Math.PI * 2.5) * 0.08;
          model.position.x = p.sx + (p.ex - p.sx) * e;
          model.position.y = p.sy + (p.ey - p.sy) * e + yBob;
          model.position.z = 0.6 + zFloat;
          model.rotation.y = p.rotY;
          const xSign = p.ex >= p.sx ? 1 : -1;
          model.rotation.z = Math.sin(t * Math.PI * 2.0) * 0.09 * xSign;
          const climbRate = (p.ey - p.sy) / 14;
          model.rotation.x = (0.05 + Math.sin(t * Math.PI * 1.5) * 0.04 - climbRate * 0.35) * xSign;
          const fit = model.userData.fitScale || 1;
          model.scale.setScalar(fit * 0.8);
          if (settleT > 0) {
            renderer.domElement.style.transition = 'none';
            renderer.domElement.style.opacity = String(1 - settleT);
          }
        }
        renderer.render(scene, camera);
        if (t >= 1) {
          finish();
        }
      };
      animate();
    };
    if (window.__threeReady) {
      startThreeIntro();
    } else {
      window.addEventListener('threeready', startThreeIntro, {
        once: true
      });
    }
    return () => {
      alive = false;
      window.__phxIntroRunning = false;
      clearTimeout(threeFailTimer);
      window.removeEventListener('threeready', startThreeIntro);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  if (usingFallback) {
    return React.createElement("div", {
      className: "phx-intro-fallback",
      ref: fallbackRef,
      "aria-hidden": "true"
    }, React.createElement("img", {
      src: "./verigate-logo.png?v=31",
      alt: "",
      className: "phx-intro-fallback-img",
      onAnimationEnd: () => {
        onDone && onDone();
      }
    }), React.createElement("style", null, `
          .phx-intro-fallback{
            position: fixed; inset: 0; z-index: 200;
            pointer-events: none; overflow: hidden;
            background: transparent;
          }
          .phx-intro-fallback-img{
            position: absolute;
            top: 62%; right: 100%;
            width: min(85vh, 75vw); height: auto;
            transform: translate3d(0, -50%, 0);
            object-fit: contain;
            opacity: 0;
            animation: phxFallback 5.0s cubic-bezier(.22,.61,.36,1) forwards;
            filter: drop-shadow(0 12px 40px rgba(240,179,117,.35))
                    drop-shadow(0 4px 14px rgba(225,104,66,.25));
          }
          @keyframes phxFallback{
            0%   { transform: translate3d(-20vw, -50%, 0); opacity: 0; }
            10%  { opacity: 1; }
            88%  { transform: translate3d(190vw, -50%, 0); opacity: 1; }
            100% { transform: translate3d(190vw, -50%, 0); opacity: 0; }
          }
          @media (prefers-reduced-motion: reduce){
            .phx-intro-fallback-img{ animation: none; opacity: 0; }
          }
        `));
  }
  return React.createElement("div", {
    ref: hostRef,
    className: "phx-intro-host",
    "aria-hidden": "true",
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      pointerEvents: 'none',
      opacity: phase === 'done' ? 0 : 1
    }
  });
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutSine(t) {
  return Math.sin(t * Math.PI / 2);
}
window.PhoenixIntro = PhoenixIntro;
})();

/* ---- Nav ---- */
(function(){
const NAV_LINKS = [{
  label: 'Product',
  href: '#product'
}, {
  label: 'Process',
  href: '#process'
}, {
  label: 'Components',
  href: '#components'
}, {
  label: 'Contact',
  href: '#contact'
}];
function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const replayIntro = e => {
    e.preventDefault();
    try {
      sessionStorage.removeItem('verigate_intro_played');
    } catch (_) {}
    try {
      window.__phxIntroRunning = false;
    } catch (_) {}
    window.dispatchEvent(new Event('verigate-replay-intro'));
  };
  return React.createElement("nav", {
    className: 'kit-nav' + (scrolled ? ' scrolled' : '')
  }, React.createElement("a", {
    href: "#",
    className: "brand",
    id: "brand-logo-target",
    onClick: replayIntro,
    title: "Replay phoenix intro",
    "aria-label": "Replay phoenix intro"
  }, React.createElement("img", {
    className: "brand-mark",
    src: "./verigate-logo.png?v=31",
    alt: "Verigate phoenix logo",
    width: "32",
    height: "32",
    decoding: "async"
  }), React.createElement("span", {
    className: "brand-text"
  }, "Verigate")), React.createElement("div", {
    className: "nav-links"
  }, NAV_LINKS.map(l => React.createElement("a", {
    key: l.href,
    href: l.href
  }, l.label))), React.createElement("a", {
    href: "https://www.linkedin.com/in/osamasunaallah/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "nav-cta",
    "aria-label": "LinkedIn \xE2\u20AC\u201D Osama Sunaallah"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: "14",
    height: "14",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"
  })), "LinkedIn"), React.createElement("style", null, `
        .kit-nav{
          position: sticky; top: 14px; z-index: 50;
          margin: 14px auto 0;
          width: min(1280px, calc(100% - 32px));
          display:flex; align-items:center; justify-content:space-between;
          gap: 24px;
          padding: 10px 14px 10px 18px;
          border:1px solid var(--line);
          background: rgba(20,23,43,.55);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border-radius: 999px;
          transition:
            padding .45s var(--easing-out),
            background .45s var(--easing-out),
            border-color .45s var(--easing-out),
            box-shadow .45s var(--easing-out);
          box-shadow: 0 10px 30px rgba(0,0,0,.25);
        }
        .kit-nav.scrolled{
          padding: 6px 10px 6px 14px;
          background: rgba(20,23,43,.78);
          border-color: var(--line-2);
          box-shadow: 0 18px 40px rgba(0,0,0,.4);
        }
        .brand{
          display:flex; align-items:center; gap:10px;
          font-family: var(--font-display); font-weight:600; min-width:0;
          cursor: pointer;
          user-select: none;
        }
        .brand:active{ transform: scale(.96); }
        .brand:active .brand-mark{ transform: rotate(-8deg) scale(.95); }
        .brand-mark{
          display: block;
          width: 32px; height: 32px;
          object-fit: contain;
          /* Phoenix-tinted glow — warm gold inner, cool violet outer.
             The PNG is now transparent so the glow reads as light
             radiating from the logo itself, not a colored square. */
          transition: transform .25s var(--easing-spring), filter .25s var(--easing);
          filter:
            drop-shadow(0 0 6px rgba(240,179,117,.30))
            drop-shadow(0 2px 8px rgba(124,138,255,.22));
        }
        .brand:hover .brand-mark{
          transform: rotate(-4deg) scale(1.05);
          filter:
            drop-shadow(0 0 10px rgba(240,179,117,.45))
            drop-shadow(0 2px 10px rgba(124,138,255,.30));
        }
        .brand-text{
          font-size: 15px; letter-spacing:.005em;
          color: var(--text);
        }
        .nav-links{ display:flex; gap:2px; }
        .nav-links a{
          position: relative;
          padding:9px 16px; border-radius:999px; font-size:14px;
          color: var(--muted);
          transition: color .25s var(--easing), background .25s var(--easing);
        }
        .nav-links a::after{
          content: "";
          position: absolute;
          left: 50%; bottom: 4px;
          transform: translateX(-50%) scaleX(0);
          width: 18px; height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transition: transform .35s var(--easing-out), box-shadow .35s var(--easing-out);
        }
        .nav-links a:hover{ color: var(--text); background: rgba(255,255,255,.05); }
        .nav-links a:hover::after{
          transform: translateX(-50%) scaleX(1);
          box-shadow: 0 0 10px rgba(124,138,255,.55);
        }
        .nav-cta{
          display: inline-flex; align-items: center; gap: 8px;
          padding:9px 16px 9px 14px;
          border-radius:999px; font-size:14px;
          background: linear-gradient(180deg, #B3BFFF, #6E7CF5);
          color:#06091A; font-weight:600;
          box-shadow: var(--glow-accent), inset 0 1px 0 rgba(255,255,255,.4);
          transition: transform .25s var(--easing-spring), box-shadow .25s var(--easing);
        }
        .nav-cta svg{ display:block; }
        .nav-cta:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 48px rgba(124,138,255,.55), inset 0 1px 0 rgba(255,255,255,.5);
        }
        @media (max-width: 980px){
          .nav-links{ display:none; }
          .kit-nav{ width: min(720px, calc(100% - 20px)); padding: 8px 10px 8px 14px; }
        }
        @media (max-width: 480px){
          .nav-cta{ padding: 8px 12px; gap: 6px; }
        }
      `));
}
window.Nav = Nav;
})();

/* ---- HeroPhoto ---- */
(function(){
const HERO_CHAPTERS = [{
  eyebrow: 'One tap. One verified shipment.',
  headlineA: 'A receiving device,',
  headlineB: 'verified instantly.',
  body: 'The driver taps an RFID card. The device pulls the matching shipment from the dashboard, shows it on the LCD, and lets the worker approve it in seconds.',
  lcdLine1: 'VERIGATE',
  lcdLine2: 'READY · SCAN',
  state: 'idle'
}, {
  eyebrow: 'Inside the enclosure',
  headlineA: 'Built around an Arduino',
  headlineB: 'and a 13.56 MHz reader.',
  body: 'A matte-black shell, a 16×2 LCD behind anti-glare glass, and the reader flush behind the SCAN panel.',
  lcdLine1: 'WAITING',
  lcdLine2: 'TAP CARD',
  state: 'idle'
}, {
  eyebrow: 'Tap. Verified. Welcome.',
  headlineA: 'Approved',
  headlineB: 'in seconds.',
  body: 'The driver taps, the device confirms: green light, gate open, and the shipment is in your ledger.',
  lcdLine1: 'APPROVED',
  lcdLine2: 'WELCOME',
  state: 'approved'
}];
const HERO_CYCLE_MS = 4500;
function HeroWords({
  text,
  on,
  accent
}) {
  return text.split(' ').map((w, i) => React.createElement("span", {
    key: i,
    className: "hp-word"
  }, React.createElement("span", {
    className: 'hp-word-in' + (accent ? ' is-accent' : ''),
    style: {
      transitionDelay: on ? i * 55 + 260 + 'ms' : '0ms'
    }
  }, w)));
}
function HeroPhoto() {
  const sectionRef = React.useRef(null);
  const [active, setActive] = React.useState(0);
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    let visible = true;
    const el = sectionRef.current;
    const io = el && 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    }, {
      threshold: 0.2
    }) : null;
    if (io) io.observe(el);
    const id = setInterval(() => {
      if (visible && !document.hidden) setActive(a => (a + 1) % HERO_CHAPTERS.length);
    }, HERO_CYCLE_MS);
    return () => {
      clearInterval(id);
      if (io) io.disconnect();
    };
  }, [tick]);
  const approved = HERO_CHAPTERS[active].state === 'approved';
  return React.createElement("section", {
    ref: sectionRef,
    className: 'hp' + (approved ? ' is-approved' : ''),
    id: "product"
  }, React.createElement("div", {
    className: "hp-bg",
    "aria-hidden": "true"
  }, React.createElement("i", {
    className: "hp-bg-ok"
  })), React.createElement("div", {
    className: "hp-shell"
  }, React.createElement("header", {
    className: "hp-head"
  }, React.createElement("div", {
    className: "hp-stack hp-eyebrows"
  }, HERO_CHAPTERS.map((c, i) => React.createElement("span", {
    key: i,
    className: 'hp-eyebrow' + (i === active ? ' on' : ''),
    "aria-hidden": i !== active
  }, React.createElement("span", {
    className: "hp-eyebrow-dot"
  }), c.eyebrow))), React.createElement("h1", {
    className: "hp-stack hp-headline"
  }, HERO_CHAPTERS.map((c, i) => React.createElement("span", {
    key: i,
    className: 'hp-hl' + (i === active ? ' on' : ''),
    "aria-hidden": i !== active
  }, React.createElement("span", {
    className: "hp-hl-line"
  }, React.createElement(HeroWords, {
    text: c.headlineA,
    on: i === active
  })), React.createElement("span", {
    className: "hp-hl-line"
  }, React.createElement(HeroWords, {
    text: c.headlineB,
    on: i === active,
    accent: true
  }))))), React.createElement("div", {
    className: "hp-stack hp-ledes"
  }, HERO_CHAPTERS.map((c, i) => React.createElement("p", {
    key: i,
    className: 'hp-lede' + (i === active ? ' on' : ''),
    "aria-hidden": i !== active
  }, c.body)))), React.createElement("div", {
    className: "hp-stage"
  }, React.createElement("div", {
    className: "hp-halo",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "hp-device-wrap"
  }, React.createElement(DeviceWithLCD, {
    activeChapter: active,
    chapters: HERO_CHAPTERS,
    className: "hp-device-3d"
  }), React.createElement("div", {
    className: "hp-floor",
    "aria-hidden": "true"
  }))), React.createElement("footer", {
    className: "hp-foot"
  }, React.createElement("div", {
    className: "hp-cta-row"
  }, React.createElement("a", {
    href: "https://www.linkedin.com/in/osamasunaallah/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn primary big"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: "16",
    height: "16",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.75c0-2.33-1.25-3.42-2.92-3.42-1.35 0-1.95.74-2.29 1.26V9.67h-2.67v8.67h2.67v-4.29c0-1.13.21-2.22 1.61-2.22 1.38 0 1.4 1.29 1.4 2.29v4.22h2.2z"
  })), "Connect on LinkedIn"), React.createElement("a", {
    href: "#process",
    className: "btn ghost big"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: "13",
    height: "13",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M7 4.5v15l12-7.5z"
  })), "See it work")), React.createElement("div", {
    className: "hp-dots",
    role: "tablist",
    "aria-label": "Hero chapters"
  }, HERO_CHAPTERS.map((c, i) => React.createElement("button", {
    key: i,
    role: "tab",
    "aria-selected": i === active,
    "aria-label": 'Show chapter ' + (i + 1),
    className: 'hp-dot' + (i === active ? ' on' : ''),
    onClick: () => {
      setActive(i);
      setTick(t => t + 1);
    }
  }, React.createElement("span", {
    className: "hp-dot-bar"
  }, React.createElement("i", {
    key: active + '-' + tick,
    style: {
      animationDuration: HERO_CYCLE_MS + 'ms'
    }
  }))))))), React.createElement("style", null, `
        .hp{ position: relative; min-height: calc(100vh - 76px); display: flex; align-items: center; overflow: hidden; isolation: isolate; }
        .hp-bg{
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(42% 38% at 50% 56%, rgba(124,138,255,.26), transparent 72%),
            radial-gradient(30% 30% at 38% 50%, rgba(167,139,250,.14), transparent 70%);
        }
        .hp-bg-ok{
          position: absolute; inset: 0; opacity: 0;
          background: radial-gradient(42% 38% at 50% 56%, rgba(126,227,181,.22), transparent 72%);
          transition: opacity .9s var(--easing);
        }
        .hp.is-approved .hp-bg-ok{ opacity: 1; }

        .hp-shell{
          position: relative; z-index: 1;
          width: min(1280px, calc(100% - 32px)); margin: 0 auto;
          min-height: calc(100vh - 76px);
          padding: clamp(18px, 4vh, 48px) 0 clamp(22px, 4vh, 44px);
          display: grid; grid-template-rows: auto 1fr auto; justify-items: center;
          gap: clamp(6px, 1.4vh, 16px); text-align: center;
        }
        .hp-head{ display: flex; flex-direction: column; align-items: center; gap: clamp(12px, 1.6vh, 20px); width: 100%; }

        /* all chapters share one grid cell, so the block never changes height */
        .hp-stack{ display: grid; width: 100%; justify-items: center; }
        .hp-stack > *{ grid-area: 1 / 1; }

        .hp-eyebrow{
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 16px 8px 12px; border-radius: 999px;
          border: 1px solid var(--line); background: rgba(255,255,255,.04);
          font: 500 11.5px/1 var(--font-mono); letter-spacing: .2em; text-transform: uppercase; color: var(--text);
          opacity: 0; transform: translateY(6px);
          transition: opacity .4s var(--easing), transform .5s var(--easing-out);
        }
        .hp-eyebrow.on{ opacity: 1; transform: none; transition-delay: .25s; }
        .hp-eyebrow-dot{ width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(124,138,255,.16); transition: background .6s, box-shadow .6s; }
        .hp.is-approved .hp-eyebrow-dot{ background: var(--ok); box-shadow: 0 0 0 4px rgba(126,227,181,.18); }

        .hp-headline{
          margin: 0; font-family: var(--font-display); font-weight: 600;
          font-size: clamp(34px, 4.7vw, 68px); line-height: 1.02; letter-spacing: -0.035em; color: var(--text);
        }
        .hp-hl{ display: flex; flex-direction: column; align-items: center; }
        .hp-hl-line{ display: flex; flex-wrap: wrap; justify-content: center; gap: 0 .24em; }
        .hp-word{ display: inline-block; overflow: hidden; padding: 0 .02em .1em; margin-bottom: -.06em; }
        .hp-word-in{
          display: inline-block; transform: translateY(105%); opacity: 0;
          transition: transform .7s cubic-bezier(.2,.85,.25,1), opacity .45s var(--easing);
        }
        .hp-hl:not(.on) .hp-word-in{ transform: translateY(-40%); opacity: 0; transition-duration: .35s, .25s; }
        .hp-hl.on .hp-word-in{ transform: none; opacity: 1; }
        .hp-word-in.is-accent{
          font-family: var(--font-serif); font-style: italic; font-weight: 400; letter-spacing: -0.02em;
          background: linear-gradient(180deg, #FFFFFF 0%, #C5CAF8 50%, var(--accent-2) 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .hp.is-approved .hp-word-in.is-accent{ background-image: linear-gradient(180deg, #FFFFFF 0%, #C8F5DA 50%, var(--ok) 100%); }

        .hp-lede{
          margin: 0; max-width: 60ch; font-size: clamp(15px, 1.1vw, 17px); line-height: 1.6; color: var(--text-2);
          opacity: 0; transform: translateY(8px);
          transition: opacity .45s var(--easing), transform .6s var(--easing-out);
        }
        .hp-lede.on{ opacity: 1; transform: none; transition-delay: .35s; }

        .hp-stage{ position: relative; width: 100%; display: flex; align-items: center; justify-content: center; min-height: 0; }
        .hp-halo{
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          width: clamp(340px, 40vw, 620px); aspect-ratio: 1; border-radius: 50%; pointer-events: none;
          background: radial-gradient(closest-side, rgba(124,138,255,.22), rgba(124,138,255,.06) 55%, transparent 72%);
          transition: background .9s var(--easing);
        }
        .hp.is-approved .hp-halo{ background: radial-gradient(closest-side, rgba(126,227,181,.2), rgba(126,227,181,.05) 55%, transparent 72%); }
        .hp-device-wrap{
          position: relative; width: min(50vmin, 44vh, 560px); aspect-ratio: 1;
          animation: hpIn 1.1s cubic-bezier(.2,.85,.25,1) .15s both;
        }
        @keyframes hpIn{ from{ opacity: 0; transform: translateY(40px) scale(.94); } to{ opacity: 1; transform: none; } }
        .hp-device-3d{ width: 100%; height: 100%; }
        .hp-floor{
          position: absolute; left: 50%; bottom: 4%; width: 60%; height: 34px; transform: translateX(-50%);
          background: radial-gradient(closest-side, rgba(0,0,0,.55), transparent); pointer-events: none; z-index: -1;
        }

        .hp-foot{ display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .hp-cta-row{ display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
        .hp-dots{ display: flex; gap: 10px; }
        .hp-dot{ padding: 10px 0; }
        .hp-dot-bar{ display: block; width: 36px; height: 3px; border-radius: 3px; background: rgba(255,255,255,.16); overflow: hidden; }
        .hp-dot-bar i{ display: block; height: 100%; width: 100%; background: var(--accent-2); transform: scaleX(0); transform-origin: left; }
        .hp-dot.on .hp-dot-bar i{ animation: hpBar linear forwards; }
        .hp.is-approved .hp-dot.on .hp-dot-bar i{ background: var(--ok); }
        @keyframes hpBar{ to{ transform: scaleX(1); } }

        @media (max-width: 760px){
          .hp-shell{ padding-top: 20px; }
          .hp-eyebrow{ font-size: 10px; letter-spacing: .16em; }
          .hp-device-wrap{ width: min(86vw, 46vh); }
          .hp-cta-row .btn{ padding: 13px 18px; font-size: 14.5px; }
        }
        @media (prefers-reduced-motion: reduce){
          .hp-word-in, .hp-lede, .hp-eyebrow{ transition: none; }
          .hp-device-wrap{ animation: none; }
        }
      `));
}
window.HeroPhoto = HeroPhoto;
})();

/* ---- Architecture ---- */
(function(){
const ARCH_NODES = [{
  id: 'card',
  label: 'RFID Card / Fob',
  sub: 'CREDENTIAL',
  icon: 'card'
}, {
  id: 'reader',
  label: 'RC522 Reader',
  sub: 'CAPTURE',
  icon: 'wave'
}, {
  id: 'mcu',
  label: 'Arduino UNO R4',
  sub: 'BRAIN',
  icon: 'chip',
  key: true
}, {
  id: 'cloud',
  label: 'Verigate Dashboard',
  sub: 'SOURCE OF TRUTH',
  icon: 'cloud'
}, {
  id: 'lcd',
  label: 'LCD 16×2',
  sub: 'DRIVER',
  icon: 'screen'
}];
const ICONS = {
  card: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "3",
    y: "6",
    width: "18",
    height: "12",
    rx: "2"
  }), React.createElement("path", {
    d: "M3 10h18M7 14h2"
  })),
  wave: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), React.createElement("path", {
    d: "M5 8a8 8 0 0 1 14 0M2 5a12 12 0 0 1 20 0"
  })),
  chip: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "6",
    y: "6",
    width: "12",
    height: "12",
    rx: "2"
  }), React.createElement("path", {
    d: "M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"
  })),
  cloud: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M7 18h10a4 4 0 0 0 .5-7.96A6 6 0 0 0 6 11a4 4 0 0 0 1 7z"
  })),
  screen: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "3",
    y: "5",
    width: "18",
    height: "14",
    rx: "2"
  }), React.createElement("path", {
    d: "M7 10h10M7 14h6"
  }))
};
function Architecture() {
  return React.createElement("section", {
    className: "section",
    id: "architecture"
  }, React.createElement("header", {
    className: "section-head center reveal"
  }, React.createElement("span", {
    className: "kicker"
  }, React.createElement("span", {
    className: "dot"
  }), "How it flows"), React.createElement("h2", {
    className: "display-2"
  }, "Five parts. ", React.createElement("em", {
    className: "serif-italic"
  }, "One source of truth"), "."), React.createElement("p", {
    className: "lede center"
  }, "A card touches the reader, the MCU asks the dashboard, and the LCD answers. Every shipment carries the same record from gate to ledger.")), React.createElement("div", {
    className: "arch reveal"
  }, React.createElement("div", {
    className: "arch-track"
  }, React.createElement("svg", {
    className: "arch-line",
    preserveAspectRatio: "none",
    viewBox: "0 0 1160 120"
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "archG",
    x1: "0",
    x2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "rgba(167,139,250,0)"
  }), React.createElement("stop", {
    offset: "50%",
    stopColor: "rgba(167,139,250,.8)"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "rgba(167,139,250,0)"
  }))), React.createElement("path", {
    d: "M30 60 H1130",
    stroke: "url(#archG)",
    strokeWidth: "1.5",
    fill: "none"
  }), React.createElement("path", {
    className: "flow",
    d: "M30 60 H1130",
    stroke: "rgba(124,138,255,.9)",
    strokeWidth: "1.5",
    fill: "none",
    strokeDasharray: "4 12"
  })), React.createElement("ul", {
    className: "arch-nodes"
  }, ARCH_NODES.map((n, i) => React.createElement("li", {
    key: n.id,
    className: 'arch-node reveal delay-' + (i + 1) + (n.key ? ' arch-node-key' : '')
  }, React.createElement("span", {
    className: "arch-ico"
  }, ICONS[n.icon]), React.createElement("b", null, n.label), React.createElement("small", null, n.sub))))), React.createElement("ul", {
    className: "arch-stats"
  }, React.createElement("li", null, React.createElement("b", null, "< 200ms"), React.createElement("span", null, "End-to-end")), React.createElement("li", null, React.createElement("b", null, "13.56 MHz"), React.createElement("span", null, "RFID")), React.createElement("li", null, React.createElement("b", null, "5 V \xB7 SPI"), React.createElement("span", null, "Bus")), React.createElement("li", null, React.createElement("b", null, "0"), React.createElement("span", null, "Mismatches")))), React.createElement("style", null, `

        .arch{
          position:relative;
          padding: 36px clamp(20px, 3vw, 40px) 30px;
          border-radius: var(--r-xl);
          border: 1px solid var(--line);
          background:
            radial-gradient(900px 280px at 50% 0%, rgba(124,138,255,.14), transparent 65%),
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          box-shadow: var(--shadow-md);
          isolation:isolate;
        }
        .arch-track{ position:relative; padding: 16px 0 8px; }
        .arch-line{ position:absolute; left:0; right:0; top:50%; width:100%; height:120px; transform: translateY(-50%); pointer-events:none; }
        .arch-line .flow{ animation: archFlow 6s linear infinite; }
        @keyframes archFlow{ 0%{ stroke-dashoffset: 0; } 100%{ stroke-dashoffset: -1160; } }
        .arch-nodes{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 14px; position:relative; z-index:1; }
        .arch-node{
          position: relative;
          display:flex; flex-direction:column; align-items:center; gap: 8px;
          text-align:center;
          padding: 22px 14px 20px;
          border-radius: var(--r-md);
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.01)),
            var(--surface);
          box-shadow: var(--shadow-sm);
          transition:
            transform .45s var(--easing-out),
            border-color .35s var(--easing),
            box-shadow .35s var(--easing);
          will-change: transform;
        }
        .arch-node:hover{
          transform: translateY(-6px);
          border-color: var(--line-3);
          box-shadow: var(--shadow-md);
        }
        .arch-node:hover .arch-ico{
          transform: rotate(-4deg) scale(1.08);
        }
        .arch-ico{
          width:48px; height:48px;
          border-radius: 14px;
          display:inline-flex; align-items:center; justify-content:center;
          background: linear-gradient(160deg, rgba(124,138,255,.10), rgba(124,138,255,.02));
          border:1px solid rgba(124,138,255,.22);
          color: var(--accent);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
          transition: transform .35s var(--easing-spring);
        }
        .arch-ico svg{ width: 22px; height: 22px; }
        .arch-node b{ font-family: var(--font-display); font-size: 14.5px; letter-spacing:-0.005em; color: var(--text); }
        .arch-node small{ font: 600 10.5px/1 var(--font-mono); letter-spacing:.16em; text-transform:uppercase; color: var(--muted); }
        .arch-node-key{
          border-color: rgba(124,138,255,.45);
          background: linear-gradient(180deg, var(--accent), var(--accent-3));
          color: #FFFFFF;
          box-shadow: var(--glow-accent);
        }
        .arch-node-key b, .arch-node-key small{ color: #FFFFFF; }
        .arch-node-key small{ opacity: .85; }
        .arch-node-key .arch-ico{
          color:#fff;
          background: rgba(255,255,255,.18);
          border-color: rgba(255,255,255,.35);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.3);
        }

        .arch-stats{
          list-style:none;
          padding: 26px 0 0;
          margin: 26px 0 0;
          border-top: 1px dashed var(--line);
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 14px;
        }
        .arch-stats li{ display:flex; flex-direction:column; align-items:center; gap: 4px; text-align:center; }
        .arch-stats b{
          font-family: var(--font-display);
          font-size: clamp(26px, 2.6vw, 36px);
          letter-spacing:-0.022em;
          color: var(--text);
        }
        .arch-stats span{ font: 600 11px/1 var(--font-mono); letter-spacing:.16em; text-transform:uppercase; color: var(--muted); }

        @media (max-width: 900px){
          .arch-nodes{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          .arch-line{ display:none; }
          .arch-stats{ grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
      `));
}
window.Architecture = Architecture;
})();

/* ---- Capabilities ---- */
(function(){
const CAPS = [{
  accent: 'a',
  title: 'Tap once. Done.',
  tag: 'LATENCY',
  desc: 'The reader picks up the card the instant it touches the panel. The dashboard answers in under 200 ms.',
  icon: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), React.createElement("path", {
    d: "M5 8a8 8 0 0 1 14 0M2 5a12 12 0 0 1 20 0"
  }))
}, {
  accent: 'b',
  title: 'Verified at the source',
  tag: 'TRUST',
  desc: 'Each card is bound to one driver. The shipment that appears on the LCD is the shipment in the ledger.',
  icon: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"
  }), React.createElement("path", {
    d: "m9 12 2 2 4-4"
  }))
}, {
  accent: 'c',
  title: 'No paperwork. No retyping.',
  tag: 'WORKFLOW',
  desc: 'Approvals move from a clipboard to a button. Every event lands in the same dashboard, in real time.',
  icon: React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("rect", {
    x: "4",
    y: "3",
    width: "16",
    height: "18",
    rx: "2"
  }), React.createElement("path", {
    d: "M8 8h8M8 12h6M8 16h8"
  }))
}];
function Capabilities() {
  return React.createElement("section", {
    className: "section",
    id: "capabilities"
  }, React.createElement("header", {
    className: "section-head center reveal"
  }, React.createElement("span", {
    className: "kicker"
  }, "Capabilities"), React.createElement("h2", {
    className: "display-2"
  }, "Built for the gate, ", React.createElement("em", {
    className: "serif-italic"
  }, "not the office"), ".")), React.createElement("div", {
    className: "cap-grid"
  }, CAPS.map((c, i) => React.createElement("article", {
    key: i,
    className: 'cap reveal delay-' + (i + 1),
    "data-accent": c.accent
  }, React.createElement("div", {
    className: "cap-shine",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "cap-ico"
  }, c.icon), React.createElement("h3", null, c.title), React.createElement("p", null, c.desc), React.createElement("span", {
    className: "cap-tag"
  }, c.tag)))), React.createElement("style", null, `
        .cap-grid{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 18px; }
        .cap{
          position:relative; overflow:hidden;
          padding: 28px 26px 24px;
          border-radius: var(--r-lg);
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          box-shadow: var(--shadow-sm);
          transition:
            transform .55s var(--easing-out),
            border-color .35s var(--easing),
            box-shadow .45s var(--easing);
          will-change: transform;
        }
        .cap::before{
          content:""; position:absolute; inset:0;
          background: radial-gradient(420px 200px at 0% 0%, rgba(124,138,255,.06), transparent 70%);
          opacity:0; transition: opacity .45s var(--easing);
          pointer-events:none;
        }
        .cap::after{
          content:""; position:absolute; left:0; top:0; bottom:0;
          width: 3px;
          background: linear-gradient(180deg, transparent, var(--accent), transparent);
          transform: scaleY(0); transform-origin: center;
          transition: transform .55s var(--easing-out);
        }
        .cap:hover{
          transform: translateY(-8px);
          border-color: var(--line-2);
          box-shadow: var(--shadow-lg);
        }
        .cap:hover::before{ opacity:1; }
        .cap:hover::after{ transform: scaleY(1); }
        .cap-shine{
          position: absolute; inset: 0;
          background: linear-gradient(115deg,
            transparent 30%,
            rgba(124,138,255,.07) 48%,
            rgba(124,138,255,.14) 50%,
            rgba(124,138,255,.07) 52%,
            transparent 70%);
          opacity: 0;
          transform: translateX(-30%);
          transition: opacity .5s var(--easing), transform 1.1s var(--easing-out);
          pointer-events: none;
          z-index: 1;
        }
        .cap:hover .cap-shine{ opacity: 1; transform: translateX(30%); }
        .cap:hover .cap-ico{ transform: rotate(-6deg) scale(1.05); }
        .cap-ico{
          position: relative; z-index: 2;
          width:48px; height:48px; border-radius: 14px;
          display:inline-flex; align-items:center; justify-content:center;
          background: linear-gradient(160deg, rgba(124,138,255,.10), rgba(124,138,255,.02));
          border:1px solid rgba(124,138,255,.22);
          color: var(--accent);
          margin-bottom: 20px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
          transition: transform .45s var(--easing-spring);
        }
        .cap-ico svg{ width: 22px; height: 22px; }
        .cap[data-accent="b"] .cap-ico{
          background: linear-gradient(160deg, rgba(126,227,181,.10), rgba(126,227,181,.02));
          border-color: rgba(126,227,181,.22);
          color: var(--ok);
        }
        .cap[data-accent="c"] .cap-ico{
          background: linear-gradient(160deg, rgba(167,139,250,.12), rgba(167,139,250,.02));
          border-color: rgba(167,139,250,.26);
          color: #C57400;
        }
        .cap h3{ font-family: var(--font-display); font-size: 20px; margin: 0 0 8px; letter-spacing:-0.012em; color: var(--text); position: relative; z-index: 2; }
        .cap p{ color: var(--muted); margin: 0 0 18px; font-size: 14.5px; line-height: 1.6; position: relative; z-index: 2; }
        .cap-tag{
          position: relative; z-index: 2;
          display:inline-block;
          font: 500 10.5px/1 var(--font-mono);
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--accent);
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(124,138,255,.06);
        }
        .cap[data-accent="b"] .cap-tag{ color: var(--ok); border-color: var(--line-ok); background: rgba(126,227,181,.06); }
        .cap[data-accent="c"] .cap-tag{ color: #C57400; border-color: rgba(167,139,250,.30); background: rgba(167,139,250,.08); }
        @media (max-width: 980px){ .cap-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 620px){ .cap-grid{ grid-template-columns: 1fr; } }
      `));
}
window.Capabilities = Capabilities;
})();

/* ---- Problems ---- */
(function(){
const PROBS = [{
  num: '01',
  title: 'Paper at the gate',
  desc: 'Clipboards lose. Receipts vanish. Every untracked tap leaves a hole in the ledger that nobody finds until the audit.'
}, {
  num: '02',
  title: 'Retyped data',
  desc: 'Drivers say one thing, the warehouse types another. Mismatches surface days later, when the trail is already cold.'
}, {
  num: '03',
  title: 'No source of truth',
  desc: 'The dashboard, the inbox, and the gate run separate stories. Reconciliation is a person — and that person is always behind.'
}];
function Problems() {
  const gridRef = React.useRef(null);
  const [stackIn, setStackIn] = React.useState(false);
  React.useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setStackIn(true);
        io.disconnect();
      }
    }, {
      threshold: 0.18
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const onCardMove = e => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--cx', x.toFixed(3));
    card.style.setProperty('--cy', y.toFixed(3));
  };
  const onCardLeave = e => {
    const card = e.currentTarget;
    card.style.setProperty('--cx', '0');
    card.style.setProperty('--cy', '0');
  };
  return React.createElement("section", {
    className: "section",
    id: "problems"
  }, React.createElement("header", {
    className: "section-head center reveal"
  }, React.createElement("span", {
    className: "kicker"
  }, "The problem"), React.createElement("h2", {
    className: "display-2"
  }, "Receiving runs on ", React.createElement("em", {
    className: "serif-italic"
  }, "faith"), ".")), React.createElement("ul", {
    ref: gridRef,
    className: 'prob-grid' + (stackIn ? ' is-spread' : '')
  }, PROBS.map((p, i) => React.createElement("li", {
    key: p.num,
    className: "prob",
    style: {
      '--idx': i,
      '--n': PROBS.length
    },
    onMouseMove: onCardMove,
    onMouseLeave: onCardLeave
  }, React.createElement("span", {
    className: "prob-glow",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "prob-shine",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "prob-num"
  }, p.num), React.createElement("h3", null, p.title), React.createElement("p", null, p.desc)))), React.createElement("style", null, `
        .prob-grid{
          list-style:none; padding:0; margin: 0;
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 18px;
          perspective: 1200px;
        }
        .prob{
          --cx: 0;
          --cy: 0;
          --stack-x: calc(((var(--idx, 0) - (var(--n, 3) - 1) / 2) * 50%) * -1);
          --stack-rot: calc((var(--idx, 0) - (var(--n, 3) - 1) / 2) * -6deg);
          position:relative; overflow:hidden;
          padding: 30px 28px;
          border-radius: var(--r-lg);
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          box-shadow: var(--shadow-sm);
          transform-style: preserve-3d;
          transform:
            translate3d(var(--stack-x), 32px, 0)
            rotate(var(--stack-rot))
            scale(.92);
          opacity: 0;
          transition:
            transform 1.1s cubic-bezier(.2,.85,.25,1),
            opacity .9s var(--easing-out),
            border-color .35s var(--easing),
            box-shadow .45s var(--easing);
          transition-delay: calc(var(--idx, 0) * 120ms + 50ms);
        }
        .prob-grid.is-spread .prob{
          opacity: 1;
          transform:
            translate3d(0, 0, 0)
            rotate(0deg)
            scale(1);
        }
        .prob-grid.is-spread .prob:hover{
          transform:
            translate3d(0, -8px, 0)
            rotateX(calc(var(--cy) * -6deg))
            rotateY(calc(var(--cx) * 8deg))
            scale(1.015);
        }
        .prob::before{
          content:""; position:absolute; inset:auto 0 0 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transform: scaleX(0); transform-origin: left;
          transition: transform .65s var(--easing-out);
        }
        .prob:hover{
          border-color: var(--line-2);
          box-shadow: var(--shadow-lg);
        }
        .prob:hover::before{ transform: scaleX(1); }
        .prob-glow{
          position: absolute;
          right: -40px; top: -40px;
          width: 240px; height: 240px;
          background: radial-gradient(closest-side, rgba(124,138,255,.25), transparent 70%);
          opacity: 0;
          filter: blur(10px);
          transition: opacity .5s var(--easing);
          pointer-events: none;
        }
        .prob:hover .prob-glow{ opacity: 1; }
        /* Diagonal shine that tracks cursor pos */
        .prob-shine{
          position: absolute; inset: 0;
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(167,139,250,.06) 48%,
            rgba(167,139,250,.14) 50%,
            rgba(167,139,250,.06) 52%,
            transparent 70%);
          opacity: 0;
          transform: translateX(-30%);
          transition: opacity .5s var(--easing), transform 1.1s var(--easing-out);
          pointer-events: none;
        }
        .prob:hover .prob-shine{ opacity: 1; transform: translateX(30%); }
        .prob:hover .prob-num{
          background: rgba(124,138,255,.10);
          border-color: rgba(124,138,255,.36);
          color: var(--accent-3);
        }
        .prob-num{
          position: relative; z-index: 1;
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .22em;
          color: var(--accent);
          margin-bottom: 18px;
          display:inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(124,138,255,.05);
          transition: background .35s var(--easing), border-color .35s var(--easing), color .35s var(--easing);
        }
        .prob h3, .prob p{ position: relative; z-index: 1; }
        .prob h3{ font-family: var(--font-display); font-size: 22px; margin: 0 0 10px; letter-spacing:-0.012em; color: var(--text); }
        .prob p{ color: var(--muted); margin: 0; line-height: 1.6; }
        @media (max-width: 980px){ .prob-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 620px){ .prob-grid{ grid-template-columns: 1fr; } }
      `));
}
window.Problems = Problems;
})();

/* ---- Solution ---- */
(function(){
const POINTS = [{
  n: '01',
  t: 'Bind a card to a driver',
  s: 'One MIFARE card per driver, one tap per arrival.'
}, {
  n: '02',
  t: 'Match shipment at the gate',
  s: 'The dashboard answers before the driver lifts their hand.'
}, {
  n: '03',
  t: 'Approve in seconds',
  s: 'A worker confirms on the LCD. The ledger updates everywhere.'
}];
function Solution() {
  return React.createElement("section", {
    className: "section",
    "data-solution": true
  }, React.createElement("div", {
    className: "solution-grid"
  }, React.createElement("div", {
    className: "solution-text reveal"
  }, React.createElement("span", {
    className: "kicker"
  }, "The solution"), React.createElement("h2", {
    className: "display-2"
  }, "A device that ", React.createElement("em", {
    className: "serif-italic"
  }, "closes the loop"), "."), React.createElement("p", {
    className: "lede"
  }, "Verigate sits on the receiving counter. The driver taps a card, the shipment appears, the worker approves."), React.createElement("ul", {
    className: "solution-points"
  }, POINTS.map(p => React.createElement("li", {
    key: p.n
  }, React.createElement("span", {
    className: "sp-num"
  }, p.n), React.createElement("div", null, React.createElement("b", null, p.t), React.createElement("small", null, p.s)))))), React.createElement("figure", {
    className: "solution-figure reveal",
    id: "solutionFigure"
  }, React.createElement("div", {
    className: "sf-frame"
  }, React.createElement("img", {
    src: "./wallpaper.jpg",
    alt: "Verigate device on a receiving counter"
  })))), React.createElement("style", null, `
        .solution-grid{ display:grid; grid-template-columns: 1fr 1.05fr; gap: clamp(28px, 4vw, 64px); align-items: center; }
        .solution-text{ display:flex; flex-direction:column; align-items:flex-start; gap: 14px; }
        .solution-text .lede{ margin-top: 8px; max-width: 50ch; }
        .solution-points{ list-style:none; padding:0; margin: 28px 0 0; display:grid; gap: 12px; width: 100%; }
        .solution-points li{
          display:grid; grid-template-columns: 56px 1fr; gap: 16px;
          align-items:center;
          padding: 18px 20px;
          border-radius: var(--r-md);
          border:1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          box-shadow: var(--shadow-sm);
          transition: transform .35s var(--easing-out), border-color .25s ease, box-shadow .3s ease;
        }
        .solution-points li:hover{
          transform: translateX(6px);
          border-color: var(--line-3);
          box-shadow: var(--shadow-md);
        }
        .sp-num{
          display:inline-flex; align-items:center; justify-content:center;
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(160deg, rgba(124,138,255,.10), rgba(124,138,255,.02));
          border:1px solid rgba(124,138,255,.22);
          font: 600 13px/1 var(--font-mono);
          color: var(--accent);
        }
        .solution-points b{ display:block; font-weight:600; margin-bottom: 2px; font-family: var(--font-display); font-size: 15.5px; color: var(--text); }
        .solution-points small{ color: var(--muted); font-size: 13.5px; }
        .solution-figure{ margin: 0; }
        .sf-frame{
          position:relative;
          border-radius: var(--r-xl);
          overflow:hidden;
          border:1px solid var(--line);
          box-shadow: var(--shadow-lg);
          background: var(--surface);
        }
        .sf-frame img{ width: 100%; height: auto; display: block; }
        .sf-tag{
          position:absolute; left: 32px; bottom: 32px;
          display:inline-flex; align-items:center; gap:8px;
          padding: 8px 12px; border-radius: 999px;
          border:1px solid var(--line-3);
          background: rgba(255,255,255,.9);
          font: 600 11px/1 var(--font-mono);
          letter-spacing:.16em; text-transform:uppercase;
          color: var(--text);
        }
        .sf-tag i{
          width: 8px; height: 8px; border-radius:50%;
          background: var(--accent);
          box-shadow: 0 0 14px rgba(124,138,255,.6);
          animation: pulse2 2.2s ease-in-out infinite;
        }
        @keyframes pulse2{ 50%{ box-shadow: 0 0 0 8px rgba(124,138,255,0); } }
        @media (max-width: 900px){ .solution-grid{ grid-template-columns: 1fr; gap: 36px; } .solution-figure{ position: static; top: auto; } }
      `));
}
window.Solution = Solution;
})();

/* ---- ReceivingScene ---- */
(function(){
const RS_DUR = 26;
const RS_CHAPTERS = [0, 6.6, 9.8, 19.2];
function ReceivingScene({
  timeRef
}) {
  const mountRef = React.useRef(null);
  React.useEffect(() => {
    const mount = mountRef.current;
    let alive = true,
      raf = 0,
      ro = null,
      io = null;
    let visible = true;
    const start = () => {
      if (!alive) return;
      const THREE = window.THREE;
      const V3 = THREE.Vector3;
      const clamp01 = x => Math.max(0, Math.min(1, x));
      const seg = (t, a, b) => clamp01((t - a) / (b - a));
      const smooth = x => x * x * (3 - 2 * x);
      const lerp = (a, b, k) => a + (b - a) * k;
      const lerpV = (a, b, k) => new V3(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
      const angLerp = (a, b, k) => {
        let d = b - a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return a + d * k;
      };
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setClearColor(0x05070f, 1);
      mount.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('role', 'img');
      renderer.domElement.setAttribute('aria-label', 'Animation: a driver taps his card on the Verigate device and is approved; a worker weighs the shipment and his tablet confirms the quantity matches.');
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x05070f, 9, 22);
      const camera = new THREE.PerspectiveCamera(40, 16 / 10, 0.05, 60);
      scene.add(new THREE.HemisphereLight(0xb7c8ff, 0x1a1f33, 1.0));
      const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
      key.position.set(3, 7, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, {
        left: -8,
        right: 8,
        top: 6,
        bottom: -6,
        near: 1,
        far: 20
      });
      key.shadow.bias = -0.0006;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x3b6bff, 1.2);
      rim.position.set(-5, 3, -6);
      scene.add(rim);
      const gateGlow = new THREE.PointLight(0x35d6ff, 0, 3.5);
      gateGlow.position.set(-.62, 1.4, -1.6);
      scene.add(gateGlow);
      const M = (color, rough = .7, metal = 0) => new THREE.MeshStandardMaterial({
        color,
        roughness: rough,
        metalness: metal
      });
      const canvasTex = (w, h, draw) => {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        draw(c.getContext('2d'), w, h);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      };
      const cardboard = canvasTex(256, 256, (x, w, h) => {
        x.fillStyle = '#b48552';
        x.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
          x.fillStyle = `rgba(80,50,20,${Math.random() * .08})`;
          x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
        x.fillStyle = 'rgba(214,190,150,.85)';
        x.fillRect(w * .44, 0, w * .12, h);
        x.fillStyle = '#f4f1ea';
        x.fillRect(w * .1, h * .62, w * .28, h * .2);
        x.fillStyle = '#222';
        for (let i = 0; i < 9; i++) x.fillRect(w * .12 + i * 7, h * .66, i % 3 ? 2 : 4, h * .1);
      });
      const boxMat = new THREE.MeshStandardMaterial({
        map: cardboard,
        roughness: .85
      });
      const add = (geo, mat, x, y, z, cast = true, recv = true) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = cast;
        m.receiveShadow = recv;
        scene.add(m);
        return m;
      };
      const floorTex = canvasTex(512, 512, (x, w, h) => {
        x.fillStyle = '#1b2232';
        x.fillRect(0, 0, w, h);
        x.strokeStyle = 'rgba(140,170,255,.09)';
        x.lineWidth = 2;
        for (let i = 0; i <= 8; i++) {
          x.beginPath();
          x.moveTo(i * w / 8, 0);
          x.lineTo(i * w / 8, h);
          x.stroke();
          x.beginPath();
          x.moveTo(0, i * h / 8);
          x.lineTo(w, i * h / 8);
          x.stroke();
        }
      });
      floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(6, 5);
      const floor = add(new THREE.PlaneGeometry(26, 18), new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: .55,
        metalness: .2
      }), 0, 0, 0, false);
      floor.rotation.x = -Math.PI / 2;
      const yellow = new THREE.MeshStandardMaterial({
        color: 0xf2c14e,
        roughness: .6,
        emissive: 0x2a1d00
      });
      [[-2.6, 0.2, 7.5, .07], [1.95, -0.55, .07, 1.7], [1.95, -0.55, 1.7, .07]].forEach(([x, z, w, d]) => {
        const m = add(new THREE.PlaneGeometry(w, d), yellow, x, .003, z, false);
        m.rotation.x = -Math.PI / 2;
      });
      const wallMat = M(0x2a3250, .9);
      add(new THREE.BoxGeometry(5.5, 4, .2), wallMat, 1.65, 2, -2.1);
      add(new THREE.BoxGeometry(2.6, 4, .2), wallMat, -7.6, 2, -2.1);
      add(new THREE.BoxGeometry(3.4, 1.0, .2), wallMat, -4.6, 3.5, -2.1);
      const doorFrame = M(0x2a3350, .6, .3);
      add(new THREE.BoxGeometry(.12, 3, .26), doorFrame, -6.3, 1.5, -2.1);
      add(new THREE.BoxGeometry(.12, 3, .26), doorFrame, -2.9, 1.5, -2.1);
      add(new THREE.BoxGeometry(3.5, .12, .26), doorFrame, -4.6, 3, -2.1);
      const truck = M(0x8d96aa, .55, .25),
        trim = M(0x3a4152, .5, .5);
      add(new THREE.BoxGeometry(3.0, 3.0, 6), truck, -4.6, 1.75, -5.4);
      add(new THREE.BoxGeometry(.03, 2.8, .02), trim, -4.6, 1.75, -2.39, false);
      [-.75, .75].forEach(dx => add(new THREE.BoxGeometry(.04, 2.6, .05), trim, -4.6 + dx, 1.75, -2.38));
      [-1.42, 1.42].forEach(dx => [0.8, 1.75, 2.7].forEach(y => add(new THREE.BoxGeometry(.08, .16, .05), trim, -4.6 + dx, y, -2.38)));
      add(new THREE.BoxGeometry(3.0, .25, .3), M(0x222630, .6), -4.6, .45, -2.35);
      [-1.25, 1.25].forEach(dx => {
        const l = add(new THREE.BoxGeometry(.18, .1, .05), new THREE.MeshStandardMaterial({
          color: 0xff3b30,
          emissive: 0xff2a20,
          emissiveIntensity: 1.5
        }), -4.6 + dx, .7, -2.42, false);
      });
      const rackMat = M(0x2b6cb0, .5, .4),
        shelfMat = M(0x3a4257, .6, .3);
      for (let r = 0; r < 2; r++) {
        const rx = 5.0 + r * 1.9;
        [-.55, .55].forEach(dx => add(new THREE.BoxGeometry(.08, 3.2, .08), rackMat, rx + dx, 1.6, -3.2));
        [-.55, .55].forEach(dx => add(new THREE.BoxGeometry(.08, 3.2, .08), rackMat, rx + dx, 1.6, -4.2));
        for (let s = 0; s < 3; s++) {
          add(new THREE.BoxGeometry(1.2, .06, 1.1), shelfMat, rx, .4 + s * 1.05, -3.7);
          for (let b = 0; b < 3; b++) add(new THREE.BoxGeometry(.32, .3, .4), boxMat, rx - .38 + b * .38, .58 + s * 1.05, -3.6 + b % 2 * .15);
        }
      }
      [[-3, -0.5], [1.5, -0.5], [-0.5, 2.5], [3.5, 2.5]].forEach(([x, z]) => {
        add(new THREE.CylinderGeometry(.35, .35, .05, 24), new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff3dd,
          emissiveIntensity: 1.4
        }), x, 4.2, z, false, false);
        const p = new THREE.PointLight(0xffe9cc, 9, 8, 2);
        p.position.set(x, 3.9, z);
        scene.add(p);
      });
      add(new THREE.BoxGeometry(.7, 2.4, .2), M(0x232a40, .7), -.62, 1.2, -1.95);
      const panelGlow = add(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({
        color: 0x3b6bff,
        transparent: true,
        opacity: .12
      }), -.62, 1.38, -1.844, false, false);
      const LCD_W = 1024,
        LCD_H = 220;
      const lcdCanvas = document.createElement('canvas');
      lcdCanvas.width = LCD_W;
      lcdCanvas.height = LCD_H;
      const lcdCtx = lcdCanvas.getContext('2d');
      const lcdTex = new THREE.CanvasTexture(lcdCanvas);
      lcdTex.colorSpace = THREE.SRGBColorSpace;
      let lcdState = '';
      const device = new THREE.Group();
      device.position.set(-.62, 1.38, -1.82);
      scene.add(device);
      new GLTFLoader().loadAsync('./verigate-device.glb').then(gltf => {
        if (!alive) return;
        const model = gltf.scene;
        const bb = new THREE.Box3().setFromObject(model),
          size = bb.getSize(new V3());
        model.position.sub(bb.getCenter(new V3()));
        const holder = new THREE.Group();
        holder.add(model);
        holder.scale.setScalar(.3 / Math.max(size.x, size.y, size.z));
        model.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = true;
          if (o.name === 'LCD_Screen_Plane') o.material = new THREE.MeshBasicMaterial({
            map: lcdTex,
            toneMapped: false
          });
        });
        device.add(holder);
      }).catch(err => console.error('[ReceivingScene] device GLB failed:', err));
      const scaleTop = add(new THREE.BoxGeometry(1.4, .1, 1.4), M(0x5b6478, .35, .7), 1.95, .05, -.55);
      add(new THREE.BoxGeometry(1.5, .04, 1.5), M(0x262c3d, .6, .3), 1.95, .02, -.55, false);
      add(new THREE.CylinderGeometry(.04, .05, 1.05, 12), M(0x8a93a8, .3, .8), 2.95, .52, -1.35);
      const scaleCanvas = document.createElement('canvas');
      scaleCanvas.width = 512;
      scaleCanvas.height = 160;
      const scaleCtx = scaleCanvas.getContext('2d');
      const scaleTex = new THREE.CanvasTexture(scaleCanvas);
      scaleTex.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Group();
      head.position.set(2.95, 1.12, -1.33);
      head.rotation.y = -.55;
      scene.add(head);
      const headBox = new THREE.Mesh(new THREE.BoxGeometry(.46, .2, .12), M(0x1b2132, .5, .3));
      headBox.castShadow = true;
      head.add(headBox);
      const scaleScreen = new THREE.Mesh(new THREE.PlaneGeometry(.4, .125), new THREE.MeshBasicMaterial({
        map: scaleTex,
        toneMapped: false
      }));
      scaleScreen.position.z = .061;
      head.add(scaleScreen);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(.4, .03, .3), M(0x2a3147, .6, .3));
      shelf.position.set(0, -.14, .1);
      head.add(shelf);
      let scaleShown = '';
      const drawScale = (kg, settled) => {
        const txt = kg.toFixed(1).padStart(5, ' ') + ' kg';
        if (txt + settled === scaleShown) return;
        scaleShown = txt + settled;
        const x = scaleCtx,
          w = 512,
          h = 160;
        x.fillStyle = '#031208';
        x.fillRect(0, 0, w, h);
        x.font = '700 104px "JetBrains Mono", Consolas, monospace';
        x.textAlign = 'right';
        x.textBaseline = 'middle';
        x.fillStyle = 'rgba(40,255,140,.08)';
        x.fillText('888.8 kg', w - 24, h / 2 + 4);
        x.shadowColor = 'rgba(60,255,150,.9)';
        x.shadowBlur = 22;
        x.fillStyle = settled ? '#5dff9c' : '#3fd07a';
        x.fillText(txt, w - 24, h / 2 + 4);
        x.shadowBlur = 0;
        if (settled) {
          x.fillStyle = '#5dff9c';
          x.font = '700 26px "JetBrains Mono", monospace';
          x.textAlign = 'left';
          x.fillText('STABLE', 22, 30);
        }
        scaleTex.needsUpdate = true;
      };
      const padCanvas = document.createElement('canvas');
      padCanvas.width = 800;
      padCanvas.height = 560;
      const padCtx = padCanvas.getContext('2d');
      const padTex = new THREE.CanvasTexture(padCanvas);
      padTex.colorSpace = THREE.SRGBColorSpace;
      padTex.anisotropy = 8;
      const pad = new THREE.Group();
      scene.add(pad);
      const padBody = new THREE.Mesh(new THREE.BoxGeometry(.3, .21, .012), M(0x1c1e24, .4, .6));
      padBody.castShadow = true;
      pad.add(padBody);
      const padScreen = new THREE.Mesh(new THREE.PlaneGeometry(.28, .19), new THREE.MeshBasicMaterial({
        map: padTex,
        toneMapped: false
      }));
      padScreen.position.z = .0065;
      pad.add(padScreen);
      let padShown = '';
      const drawPad = (mode, kg) => {
        const key = mode + '|' + kg.toFixed(1);
        if (key === padShown) return;
        padShown = key;
        const x = padCtx,
          w = 800,
          h = 560;
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#0b1124');
        g.addColorStop(1, '#070a17');
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        x.fillStyle = '#111a33';
        x.fillRect(0, 0, w, 64);
        x.fillStyle = '#8aa5ff';
        x.font = '700 26px "Inter", Arial';
        x.textBaseline = 'middle';
        x.fillText('VERIGATE · Receiving', 28, 33);
        x.fillStyle = '#6fe3ff';
        x.font = '600 20px "JetBrains Mono", monospace';
        x.textAlign = 'right';
        x.fillText('PO-4471 · DRV-0417', w - 28, 33);
        x.textAlign = 'left';
        const row = (y, k, v, col = '#e6ecff') => {
          x.fillStyle = '#7480a6';
          x.font = '500 24px "Inter", Arial';
          x.fillText(k, 40, y);
          x.fillStyle = col;
          x.font = '700 30px "JetBrains Mono", monospace';
          x.textAlign = 'right';
          x.fillText(v, w - 40, y);
          x.textAlign = 'left';
          x.fillStyle = 'rgba(255,255,255,.06)';
          x.fillRect(40, y + 26, w - 80, 2);
        };
        row(118, 'Expected weight', '250.0 kg');
        row(182, 'Measured weight', mode === 'idle' ? '— — —' : kg.toFixed(1) + ' kg', mode === 'match' ? '#5dff9c' : '#e6ecff');
        row(246, 'Expected qty', '24 cartons');
        row(310, 'Counted qty', mode === 'match' ? '24 cartons' : '…', mode === 'match' ? '#5dff9c' : '#e6ecff');
        if (mode === 'match') {
          x.fillStyle = '#0e7a46';
          x.beginPath();
          x.roundRect(40, 368, w - 80, 150, 22);
          x.fill();
          x.strokeStyle = '#3dff9a';
          x.lineWidth = 3;
          x.stroke();
          x.fillStyle = '#eafff3';
          x.font = '800 56px "Inter", Arial';
          x.textAlign = 'center';
          x.fillText('✓  QTY MATCH', w / 2, 425);
          x.font = '700 30px "JetBrains Mono", monospace';
          x.fillStyle = '#c6f7dc';
          x.fillText('APPROVED · SHIPMENT RECORDED', w / 2, 482);
          x.textAlign = 'left';
        } else {
          x.fillStyle = '#16204a';
          x.beginPath();
          x.roundRect(40, 368, w - 80, 150, 22);
          x.fill();
          x.fillStyle = '#8aa5ff';
          x.font = '700 40px "Inter", Arial';
          x.textAlign = 'center';
          x.fillText(mode === 'idle' ? 'Waiting for the scale…' : 'Reconciling…', w / 2, 443);
          x.textAlign = 'left';
        }
        padTex.needsUpdate = true;
      };
      const box = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .42), boxMat);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      const card = new THREE.Mesh(new THREE.BoxGeometry(.085, .055, .004), new THREE.MeshStandardMaterial({
        color: 0xf4f6fb,
        roughness: .4,
        emissive: 0x223366,
        emissiveIntensity: .2
      }));
      scene.add(card);
      function person({
        shirt,
        pants,
        skin,
        hair,
        capColor,
        vest
      }) {
        const root = new THREE.Group();
        scene.add(root);
        const mk = (geo, mat, parent, x, y, z) => {
          const m = new THREE.Mesh(geo, mat);
          m.position.set(x, y, z);
          m.castShadow = true;
          parent.add(m);
          return m;
        };
        const shirtM = M(shirt, .8),
          pantsM = M(pants, .85),
          skinM = M(skin, .65),
          shoeM = M(0x121317, .5),
          hairM = M(hair, .9);
        const hips = new THREE.Group();
        hips.position.y = .95;
        root.add(hips);
        mk(new THREE.CapsuleGeometry(.13, .1, 6, 14), pantsM, hips, 0, -.02, 0).scale.set(1.3, 1, .8);
        mk(new THREE.TorusGeometry(.165, .018, 8, 24), M(0x151515, .4, .4), hips, 0, .07, 0).rotation.x = Math.PI / 2;
        const spine = new THREE.Group();
        spine.position.y = .05;
        hips.add(spine);
        mk(new THREE.CapsuleGeometry(.165, .32, 8, 16), shirtM, spine, 0, .3, 0).scale.set(1.1, 1, .66);
        if (vest) {
          const vestM = new THREE.MeshStandardMaterial({
            color: vest,
            roughness: .6,
            emissive: vest,
            emissiveIntensity: .12
          });
          mk(new THREE.CapsuleGeometry(.17, .26, 8, 16), vestM, spine, 0, .3, 0).scale.set(1.12, 1, .7);
          const stripe = new THREE.MeshStandardMaterial({
            color: 0xdfe6ee,
            roughness: .25,
            metalness: .8,
            emissive: 0x9aa4b0,
            emissiveIntensity: .25
          });
          [.22, .36].forEach(y => {
            const st = mk(new THREE.TorusGeometry(.172, .012, 6, 32), stripe, spine, 0, y, 0);
            st.rotation.x = Math.PI / 2;
            st.scale.set(1.12, .7, 1);
          });
        }
        mk(new THREE.CylinderGeometry(.05, .058, .09, 12), skinM, spine, 0, .6, 0);
        const headG = new THREE.Group();
        headG.position.y = .74;
        spine.add(headG);
        mk(new THREE.SphereGeometry(.105, 24, 18), skinM, headG, 0, 0, 0).scale.set(.94, 1.1, 1);
        mk(new THREE.SphereGeometry(.022, 10, 8), skinM, headG, 0, -.01, .1);
        [-.1, .1].forEach(x => mk(new THREE.SphereGeometry(.022, 10, 8), skinM, headG, x, 0, 0));
        if (capColor) {
          const capM = M(capColor, .7);
          mk(new THREE.SphereGeometry(.11, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), capM, headG, 0, .03, 0).scale.set(1, .95, 1.05);
          mk(new THREE.CylinderGeometry(.1, .1, .012, 24, 1, false, -Math.PI / 2, Math.PI), capM, headG, 0, .03, .07).scale.set(1, 1, .9);
        } else mk(new THREE.SphereGeometry(.11, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), hairM, headG, 0, .025, -.012);
        const limb = (parent, x, y, r1, l1, r2, l2, m1, m2, isLeg) => {
          const a = new THREE.Group();
          a.position.set(x, y, 0);
          parent.add(a);
          mk(new THREE.CapsuleGeometry(r1, l1, 4, 12), m1, a, 0, -l1 / 2 - r1 * .4, 0);
          const b = new THREE.Group();
          b.position.y = -l1 - r1 * .9;
          a.add(b);
          mk(new THREE.CapsuleGeometry(r2, l2, 4, 12), m2, b, 0, -l2 / 2 - r2 * .4, 0);
          const c = new THREE.Group();
          c.position.y = -l2 - r2 * 1.1;
          b.add(c);
          const end = isLeg ? mk(new THREE.BoxGeometry(.11, .075, .26), shoeM, c, 0, -.02, .05) : mk(new THREE.SphereGeometry(.05, 14, 10), skinM, c, 0, -.03, .005);
          if (!isLeg) end.scale.set(.85, 1.15, .7);
          return {
            a,
            b,
            c,
            end
          };
        };
        const armL = limb(spine, .215, .54, .05, .22, .044, .2, shirtM, skinM, false);
        const armR = limb(spine, -.215, .54, .05, .22, .044, .2, shirtM, skinM, false);
        const legL = limb(hips, .09, -.06, .07, .34, .058, .35, pantsM, pantsM, true);
        const legR = limb(hips, -.09, -.06, .07, .34, .058, .35, pantsM, pantsM, true);
        const pose = ({
          ph = 0,
          amp = 0,
          bend = 0,
          armL: aL,
          armR: aR,
          swing = 0,
          idle = 0
        }) => {
          const legs = [[legL, ph], [legR, ph + Math.PI]];
          legs.forEach(([L, p]) => {
            const thigh = -Math.sin(p) * .46 * amp;
            const knee = (Math.max(0, Math.sin(p - 1.1)) * 1.0 + .06) * amp;
            L.a.rotation.x = thigh - bend * 1.15;
            L.b.rotation.x = knee + bend * 2.0;
            L.c.rotation.x = -(thigh + knee) * .55 * amp - bend * .85 + Math.max(0, -Math.sin(p)) * .25 * amp;
          });
          hips.position.y = .95 - bend * .33 - Math.cos(ph * 2) * .02 * amp;
          hips.position.x = Math.sin(ph) * .018 * amp;
          hips.rotation.y = Math.sin(ph) * .13 * amp;
          spine.rotation.set(bend * .72 + .04 * amp, -Math.sin(ph) * .2 * amp, Math.sin(ph) * .03 * amp + Math.sin(idle * 1.3) * .008);
          headG.rotation.set(-bend * .35 - .04 * amp, -(spine.rotation.y + hips.rotation.y) * .9, 0);
          const sw = Math.sin(ph) * .5 * amp * swing;
          armL.a.rotation.set(aL[0] + sw, 0, aL[1]);
          armL.b.rotation.x = aL[2] - Math.max(0, sw) * .4;
          armL.c.rotation.x = -.1;
          armR.a.rotation.set(aR[0] - sw, 0, aR[1]);
          armR.b.rotation.x = aR[2] - Math.max(0, -sw) * .4;
          armR.c.rotation.x = -.1;
        };
        return {
          root,
          hips,
          spine,
          armL,
          armR,
          pose
        };
      }
      const driver = person({
        shirt: 0x203258,
        pants: 0x2a2f3a,
        skin: 0xc99a7a,
        hair: 0x2b1d14,
        capColor: 0x1d2c52,
        vest: 0xc6e03a
      });
      const worker = person({
        shirt: 0x1d5240,
        pants: 0x2b2f3a,
        skin: 0xb98563,
        hair: 0x1b130e
      });
      const handWorld = (p, arm) => arm.end.getWorldPosition(new V3());
      const REST_L = [.02, .1, -.18],
        REST_R = [.02, -.1, -.18];
      const CARRY_L = [-1.02, -.34, -.78],
        CARRY_R = [-1.02, .34, -.78];
      const ONE_L = [-.9, -.12, -1.0];
      const CARD_R = [-.55, -.05, -.9],
        SCAN_R = [-1.42, -.6, -.2],
        TAP_R = [-1.5, -.62, -.12];
      const PAD_L = [-1.18, -.2, -1.05],
        PAD_R = [-1.02, .38, -1.2],
        REACH_L = [-1.15, -.05, -.45];
      const blendTrack = (keys, t, f) => {
        if (t <= keys[0].t) return keys[0][f];
        for (let i = 0; i < keys.length - 1; i++) {
          const A = keys[i],
            B = keys[i + 1];
          if (t < B.t) {
            const k = smooth((t - A.t) / (B.t - A.t));
            const a = A[f],
              b = B[f];
            return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : typeof a === 'number' ? f === 'rot' ? angLerp(a, b, k) : lerp(a, b, k) : lerpV(a, b, k);
          }
        }
        return keys[keys.length - 1][f];
      };
      const pathAt = (keys, t) => {
        let dist = 0;
        for (let i = 0; i < keys.length - 1; i++) {
          const A = keys[i],
            B = keys[i + 1],
            len = A.p.distanceTo(B.p);
          if (t < B.t) {
            if (t <= A.t) return {
              p: A.p.clone(),
              dist,
              amp: 0
            };
            const u = (t - A.t) / (B.t - A.t),
              k = len > .01 ? smooth(u) : 0;
            const amp = len > .01 ? Math.min(1, Math.sin(Math.PI * u) * 2.2) : 0;
            return {
              p: lerpV(A.p, B.p, k),
              dist: dist + len * k,
              amp
            };
          }
          dist += len;
        }
        return {
          p: keys[keys.length - 1].p.clone(),
          dist,
          amp: 0
        };
      };
      const STRIDE = 1.25;
      const S0 = new V3(-4.0, 0, .45),
        G = new V3(-1.2, 0, -1.25),
        D2 = new V3(-.35, 0, -.56),
        WAIT = new V3(-1.55, 0, -.15);
      const DROP = new V3(-.35, .16, -1.05);
      const W0 = new V3(6.4, 0, 1.4),
        WB = new V3(.32, 0, -1.05),
        WA = new V3(.95, 0, .72),
        WS = new V3(1.95, 0, .72),
        WC = new V3(3.0, 0, .6),
        WT = new V3(3.22, 0, -.68);
      const TERM = new V3(2.95, 0, -1.33);
      const SCALE_TOP = new V3(1.95, .1 + .16, -.08);
      const H = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
      const DRV_PATH = [{
        t: 0,
        p: S0
      }, {
        t: .8,
        p: S0
      }, {
        t: 5,
        p: G
      }, {
        t: 8.5,
        p: G
      }, {
        t: 9.3,
        p: D2
      }, {
        t: 10.7,
        p: D2
      }, {
        t: 11.9,
        p: WAIT
      }];
      const DRV = [{
        t: 0,
        rot: H(S0, G),
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 5,
        rot: H(S0, G),
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 5.7,
        rot: Math.PI,
        armL: ONE_L,
        armR: CARD_R,
        bend: 0,
        swing: 0
      }, {
        t: 6.25,
        rot: Math.PI,
        armL: ONE_L,
        armR: SCAN_R,
        bend: 0,
        swing: 0
      }, {
        t: 6.55,
        rot: Math.PI,
        armL: ONE_L,
        armR: TAP_R,
        bend: 0,
        swing: 0
      }, {
        t: 7.7,
        rot: Math.PI,
        armL: ONE_L,
        armR: TAP_R,
        bend: 0,
        swing: 0
      }, {
        t: 8.1,
        rot: Math.PI,
        armL: ONE_L,
        armR: CARD_R,
        bend: 0,
        swing: 0
      }, {
        t: 8.6,
        rot: H(G, D2),
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 9.3,
        rot: Math.PI,
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 9.95,
        rot: Math.PI,
        armL: [-.75, -.3, -.55],
        armR: [-.75, .3, -.55],
        bend: 1,
        swing: 0
      }, {
        t: 10.15,
        rot: Math.PI,
        armL: [-.75, -.3, -.55],
        armR: [-.75, .3, -.55],
        bend: 1,
        swing: 0
      }, {
        t: 10.7,
        rot: H(D2, WAIT),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 11.8,
        rot: H(D2, WAIT),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 12.6,
        rot: H(WAIT, new V3(1.2, 0, -.5)),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 0
      }];
      const WRK_PATH = [{
        t: 0,
        p: W0
      }, {
        t: 10.6,
        p: W0
      }, {
        t: 13.5,
        p: WB
      }, {
        t: 14.9,
        p: WB
      }, {
        t: 15.95,
        p: WA
      }, {
        t: 16.7,
        p: WS
      }, {
        t: 17.9,
        p: WS
      }, {
        t: 18.55,
        p: WC
      }, {
        t: 19.3,
        p: WT
      }];
      const WRK = [{
        t: 0,
        rot: H(W0, WB),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 13.3,
        rot: H(W0, WB),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 13.6,
        rot: -Math.PI / 2,
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 0
      }, {
        t: 14.15,
        rot: -Math.PI / 2,
        armL: [-.75, -.3, -.55],
        armR: [-.75, .3, -.55],
        bend: 1,
        swing: 0
      }, {
        t: 14.3,
        rot: -Math.PI / 2,
        armL: [-.75, -.3, -.55],
        armR: [-.75, .3, -.55],
        bend: 1,
        swing: 0
      }, {
        t: 14.9,
        rot: H(WB, WA),
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 15.7,
        rot: H(WB, WA),
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 16.2,
        rot: H(WA, WS),
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 16.75,
        rot: Math.PI,
        armL: CARRY_L,
        armR: CARRY_R,
        bend: 0,
        swing: 0
      }, {
        t: 17.3,
        rot: Math.PI,
        armL: [-1.15, -.3, -.4],
        armR: [-1.15, .3, -.4],
        bend: .55,
        swing: 0
      }, {
        t: 17.45,
        rot: Math.PI,
        armL: [-1.15, -.3, -.4],
        armR: [-1.15, .3, -.4],
        bend: .55,
        swing: 0
      }, {
        t: 17.85,
        rot: Math.PI,
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 18.2,
        rot: H(WS, WC),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 18.55,
        rot: H(WC, WT),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 1
      }, {
        t: 19.3,
        rot: H(WT, TERM),
        armL: REST_L,
        armR: REST_R,
        bend: 0,
        swing: 0
      }, {
        t: 19.55,
        rot: H(WT, TERM),
        armL: REACH_L,
        armR: REST_R,
        bend: .1,
        swing: 0
      }, {
        t: 19.75,
        rot: H(WT, TERM),
        armL: REACH_L,
        armR: REST_R,
        bend: .1,
        swing: 0
      }, {
        t: 20.5,
        rot: .45,
        armL: PAD_L,
        armR: PAD_R,
        bend: 0,
        swing: 0
      }];
      const fx = (geo, color) => {
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        }));
        scene.add(m);
        return m;
      };
      const rings = [0, 1, 2].map(() => {
        const r = fx(new THREE.RingGeometry(.07, .082, 48), 0x35d6ff);
        r.position.set(-.62, 1.33, -1.79);
        return r;
      });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshBasicMaterial({
        color: 0x3b6bff
      }));
      beacon.position.set(-.62, 2.5, -1.82);
      scene.add(beacon);
      const beaconHalo = fx(new THREE.SphereGeometry(.09, 16, 12), 0x3b6bff);
      beaconHalo.position.copy(beacon.position);
      const lcdHalo = fx(new THREE.PlaneGeometry(.55, .3), 0x35d6ff);
      lcdHalo.position.set(-.62, 1.42, -1.835);
      const tickTex = canvasTex(256, 256, (x, w, h) => {
        x.strokeStyle = '#5dff9c';
        x.lineWidth = 18;
        x.lineCap = 'round';
        x.shadowColor = '#3dff9a';
        x.shadowBlur = 24;
        x.beginPath();
        x.arc(w / 2, h / 2, 92, 0, Math.PI * 2);
        x.stroke();
        x.beginPath();
        x.moveTo(82, 132);
        x.lineTo(116, 166);
        x.lineTo(178, 96);
        x.stroke();
      });
      const tick = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tickTex,
        transparent: true,
        opacity: 0,
        depthWrite: false
      }));
      tick.scale.set(.26, .26, 1);
      scene.add(tick);
      const halo = fx(new THREE.RingGeometry(.95, 1.02, 64), 0x3dff9a);
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(1.95, .012, -.55);
      let padKey = '';
      const drawPad2 = (t, kg) => {
        const prog = clamp01(seg(t, 20.1, 21.3)),
          ok = clamp01(seg(t, 21.3, 21.8));
        const key = (t < 17.4 ? 'i' : '') + prog.toFixed(2) + ok.toFixed(2) + kg.toFixed(0);
        if (key === padKey) return;
        padKey = key;
        const x = padCtx,
          w = 800,
          h = 560;
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#0b1124');
        g.addColorStop(1, '#070a17');
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        x.fillStyle = '#111a33';
        x.fillRect(0, 0, w, 64);
        x.textBaseline = 'middle';
        x.textAlign = 'left';
        x.fillStyle = '#8aa5ff';
        x.font = '700 26px Inter, Arial';
        x.fillText('VERIGATE · Receiving', 28, 33);
        x.fillStyle = '#6fe3ff';
        x.font = '600 20px "JetBrains Mono", monospace';
        x.textAlign = 'right';
        x.fillText('PO-4471 · DRV-0417', w - 28, 33);
        x.textAlign = 'left';
        const row = (y, k, v, col) => {
          x.fillStyle = '#7480a6';
          x.font = '500 24px Inter, Arial';
          x.fillText(k, 40, y);
          x.fillStyle = col || '#e6ecff';
          x.font = '700 30px "JetBrains Mono", monospace';
          x.textAlign = 'right';
          x.fillText(v, w - 40, y);
          x.textAlign = 'left';
          x.fillStyle = 'rgba(255,255,255,.06)';
          x.fillRect(40, y + 26, w - 80, 2);
        };
        const green = '#5dff9c';
        row(112, 'Expected weight', '250.0 kg');
        row(176, 'Measured weight', t < 17.4 ? '— — —' : kg.toFixed(1) + ' kg', ok > 0 ? green : null);
        row(240, 'Expected qty', '24 cartons');
        row(304, 'Counted qty', ok > 0 ? '24 / 24' : prog > 0 ? Math.round(prog * 24) + ' / 24' : '…', ok > 0 ? green : null);
        x.save();
        x.beginPath();
        x.roundRect(40, 360, w - 80, 160, 24);
        x.clip();
        x.fillStyle = ok > 0 ? `rgb(${lerp(22, 14, ok)},${lerp(32, 122, ok)},${lerp(74, 70, ok)})` : '#16204a';
        x.fillRect(40, 360, w - 80, 160);
        if (ok > 0) {
          x.globalAlpha = ok;
          x.strokeStyle = '#3dff9a';
          x.lineWidth = 4;
          x.strokeRect(42, 362, w - 84, 156);
          x.globalAlpha = 1;
          x.strokeStyle = '#eafff3';
          x.lineWidth = 12;
          x.lineCap = 'round';
          x.beginPath();
          const p1 = Math.min(1, ok * 2),
            p2 = Math.max(0, ok * 2 - 1);
          x.moveTo(150, 440);
          x.lineTo(150 + 28 * p1, 440 + 28 * p1);
          if (p2 > 0) x.lineTo(178 + 56 * p2, 468 - 64 * p2);
          x.stroke();
          x.fillStyle = `rgba(234,255,243,${ok})`;
          x.font = '800 54px Inter, Arial';
          x.fillText('QTY MATCH', 280, 420);
          x.fillStyle = `rgba(198,247,220,${ok})`;
          x.font = '700 26px "JetBrains Mono", monospace';
          x.fillText('APPROVED · SHIPMENT RECORDED', 280, 474);
        } else {
          x.fillStyle = '#8aa5ff';
          x.font = '700 34px Inter, Arial';
          x.textAlign = 'center';
          x.fillText(t < 17.4 ? 'Waiting for the scale…' : 'Reconciling with the manifest…', w / 2, 420);
          x.textAlign = 'left';
          x.fillStyle = 'rgba(255,255,255,.1)';
          x.beginPath();
          x.roundRect(110, 462, w - 220, 14, 7);
          x.fill();
          const gb = x.createLinearGradient(110, 0, w - 110, 0);
          gb.addColorStop(0, '#3b6bff');
          gb.addColorStop(1, '#35d6ff');
          x.fillStyle = gb;
          x.beginPath();
          x.roundRect(110, 462, (w - 220) * prog, 14, 7);
          x.fill();
        }
        x.restore();
        padTex.needsUpdate = true;
      };
      const camState = t => {
        const follow = pathAt(DRV_PATH, Math.min(t, 5)).p;
        return [{
          t0: 0,
          a: [follow.clone().add(new V3(2.4, 1.85, 4.3)), follow.clone().add(new V3(.2, 1.05, -.4))],
          b: null
        }, {
          t0: 5.0,
          a: [new V3(1.0, 1.85, .25), new V3(-.68, 1.36, -1.8)],
          b: [new V3(.62, 1.62, -.22), new V3(-.68, 1.33, -1.8)]
        }, {
          t0: 8.6,
          a: [new V3(1.7, 2.6, 4.5), new V3(-.25, .7, -1.0)],
          b: [new V3(1.25, 2.3, 3.7), new V3(.05, .6, -.9)]
        }, {
          t0: 13.8,
          a: [new V3(4.4, 2.2, 3.4), new V3(1.5, .6, -.55)],
          b: [new V3(3.6, 1.75, 2.5), new V3(1.95, .5, -.4)]
        }, {
          t0: 19.5,
          pad: true
        }, {
          t0: 23.4,
          a: [new V3(1.7, 3.4, 7.3), new V3(.6, .8, -1.0)],
          b: [new V3(1.25, 3.1, 6.6), new V3(.6, .8, -1.0)]
        }];
      };
      const padCam = () => {
        const p = pad.getWorldPosition(new V3());
        const n = new V3(0, 0, 1).applyQuaternion(pad.getWorldQuaternion(new THREE.Quaternion()));
        return [p.clone().add(n.multiplyScalar(.82)).add(new V3(.12, .05, 0)), p.clone().add(new V3(0, .02, 0))];
      };
      function cameraAt(t) {
        const shots = camState(t);
        const frameOf = i => {
          const s = shots[i];
          if (s.pad) return padCam();
          if (!s.b) return s.a;
          const end = i + 1 < shots.length ? shots[i + 1].t0 : RS_DUR;
          const k = smooth(seg(t, s.t0, end));
          return [lerpV(s.a[0], s.b[0], k), lerpV(s.a[1], s.b[1], k)];
        };
        let i = 0;
        while (i < shots.length - 1 && t >= shots[i + 1].t0) i++;
        const cur = frameOf(i),
          blend = 1.6;
        if (i > 0 && t - shots[i].t0 < blend) {
          const prev = frameOf(i - 1),
            k = smooth(smooth((t - shots[i].t0) / blend));
          return [lerpV(prev[0], cur[0], k), lerpV(prev[1], cur[1], k)];
        }
        return cur;
      }
      function renderAt(t) {
        const dp = pathAt(DRV_PATH, t),
          wp = pathAt(WRK_PATH, t);
        driver.root.position.copy(dp.p);
        driver.root.rotation.y = blendTrack(DRV, t, 'rot');
        driver.pose({
          ph: dp.dist / STRIDE * Math.PI * 2,
          amp: dp.amp,
          bend: blendTrack(DRV, t, 'bend'),
          armL: blendTrack(DRV, t, 'armL'),
          armR: blendTrack(DRV, t, 'armR'),
          swing: blendTrack(DRV, t, 'swing'),
          idle: t
        });
        driver.root.visible = true;
        worker.root.position.copy(wp.p);
        worker.root.rotation.y = blendTrack(WRK, t, 'rot');
        worker.pose({
          ph: wp.dist / STRIDE * Math.PI * 2,
          amp: wp.amp,
          bend: blendTrack(WRK, t, 'bend'),
          armL: blendTrack(WRK, t, 'armL'),
          armR: blendTrack(WRK, t, 'armR'),
          swing: blendTrack(WRK, t, 'swing'),
          idle: t + 2
        });
        worker.root.visible = t > 10.4;
        scene.updateMatrixWorld(true);
        const between = p => handWorld(p, p.armL).add(handWorld(p, p.armR)).multiplyScalar(.5).add(new V3(0, .05, 0).applyAxisAngle(new V3(0, 1, 0), p.root.rotation.y));
        const oneHand = handWorld(driver, driver.armL).add(new V3(-.05, .12, 0));
        let bp, brot;
        if (t < 10.0) {
          const w1 = smooth(seg(t, 5.2, 5.7)) * (1 - smooth(seg(t, 8.1, 8.6)));
          bp = lerpV(between(driver), oneHand, w1);
          bp = lerpV(bp, DROP, smooth(seg(t, 9.6, 9.98)));
          brot = driver.root.rotation.y;
        } else if (t < 14.3) {
          bp = lerpV(DROP, between(worker), smooth(seg(t, 14.0, 14.3)));
          brot = lerp(Math.PI, worker.root.rotation.y, smooth(seg(t, 14.0, 14.3)));
        } else {
          const land = smooth(seg(t, 17.0, 17.4));
          bp = lerpV(between(worker), SCALE_TOP, land);
          bp.y += Math.sin(land * Math.PI) * .04;
          brot = angLerp(worker.root.rotation.y, Math.PI, land);
        }
        box.position.copy(bp);
        box.rotation.set(0, brot, 0);
        const sinceLand = t - 17.4;
        scaleTop.position.y = .05 - (sinceLand > 0 ? .012 * Math.exp(-sinceLand * 5) * Math.cos(sinceLand * 22) + .004 : 0);
        if (sinceLand > 0) box.position.y += scaleTop.position.y - .05;
        const cardOn = t > 5.4 && t < 8.3;
        card.visible = cardOn;
        if (cardOn) {
          card.position.copy(handWorld(driver, driver.armR)).add(new V3(0, .02, -.035));
          card.rotation.set(0, Math.PI, 0);
        }
        const shelfP = head.localToWorld(new V3(0, -.11, .12));
        const shelfQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + .2, head.rotation.y, 0, 'YXZ'));
        const handsP = handWorld(worker, worker.armL).add(handWorld(worker, worker.armR)).multiplyScalar(.5).add(new V3(0, .1, 0));
        const handsQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.42, worker.root.rotation.y, 0, 'YXZ'));
        const take = smooth(seg(t, 19.6, 20.1));
        pad.position.copy(lerpV(shelfP, handsP, take));
        pad.quaternion.copy(shelfQ).slerp(handsQ, take);
        const lcd = t < 6.6 ? {
          lcdLine1: 'VERIGATE',
          lcdLine2: 'READY · SCAN',
          state: 'idle'
        } : t < 7.5 ? {
          lcdLine1: 'SCANNING',
          lcdLine2: 'CARD · DRV-0417',
          state: 'scanning'
        } : t < 11.5 ? {
          lcdLine1: 'APPROVED',
          lcdLine2: 'WELCOME · DRV-0417',
          state: 'approved'
        } : {
          lcdLine1: 'VERIGATE',
          lcdLine2: 'READY · SCAN',
          state: 'idle'
        };
        if (typeof drawLCD === 'function') {
          drawLCD(lcdCtx, lcdCanvas, lcd, t * 1000);
          lcdTex.needsUpdate = true;
        }
        const approved = lcd.state === 'approved',
          scanning = lcd.state === 'scanning';
        rings.forEach((r, j) => {
          const p = seg(t, 6.6 + j * .25, 7.6 + j * .25);
          r.material.opacity = p > 0 && p < 1 ? (1 - p) * .9 : 0;
          r.scale.setScalar(1 + p * 3.2);
        });
        const pulse = .75 + Math.sin(t * 8) * .25;
        lcdHalo.material.color.set(approved ? 0x25e08a : 0x35d6ff);
        lcdHalo.material.opacity = approved ? .55 * pulse : scanning ? .4 : .12;
        beacon.material.color.set(approved ? 0x3dff9a : scanning ? 0x35d6ff : 0x3b6bff);
        beaconHalo.material.color.copy(beacon.material.color);
        beaconHalo.material.opacity = approved ? .6 * pulse : .15;
        gateGlow.intensity = approved ? 4 * pulse : scanning ? 1.8 : 0;
        gateGlow.color.set(approved ? 0x25e08a : 0x35d6ff);
        panelGlow.material.color.set(approved ? 0x25e08a : 0x3b6bff);
        panelGlow.material.opacity = approved ? .3 : scanning ? .22 : .08;
        const tk = seg(t, 7.55, 9.2);
        tick.material.opacity = tk > 0 && tk < 1 ? Math.min(1, tk * 6) * (1 - smooth(seg(t, 8.6, 9.2))) : 0;
        tick.position.set(-.62, 1.72 + smooth(tk) * .18, -1.7);
        tick.scale.setScalar(.18 + backOutS(Math.min(1, tk * 4)) * .1);
        const wk = t < 17.4 ? 0 : t < 18.4 ? 250 * smooth(seg(t, 17.4, 18.4)) + Math.sin(t * 34) * 5 * (1 - seg(t, 17.4, 18.4)) : 250;
        drawScale(Math.max(0, wk), t >= 18.4);
        const hp = seg(t, 18.4, 19.4);
        halo.material.opacity = hp > 0 && hp < 1 ? (1 - hp) * .8 : 0;
        halo.scale.setScalar(1 + hp * .35);
        drawPad2(t, Math.max(0, wk));
        const [cp, ct] = cameraAt(t);
        camera.position.copy(cp);
        camera.lookAt(ct);
        renderer.render(scene, camera);
      }
      function backOutS(x) {
        const c = 1.7;
        return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
      }
      const size = () => {
        const w = Math.max(mount.clientWidth, 200),
          h = Math.max(mount.clientHeight, 150);
        camera.aspect = w / h;
        camera.fov = w / h < 1.2 ? 50 : 40;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      ro = new ResizeObserver(size);
      ro.observe(mount);
      size();
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      }, {
        threshold: 0
      });
      io.observe(mount);
      let last = -1,
        lastPaint = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden) return;
        const t = Math.max(0, Math.min(RS_DUR, timeRef.current));
        if (t !== last || performance.now() - lastPaint > 120) {
          last = t;
          lastPaint = performance.now();
          renderAt(t);
        }
      };
      loop();
      mount.__dispose = () => {
        renderer.dispose();
        [cardboard, floorTex, lcdTex, scaleTex, padTex].forEach(x => x.dispose());
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    };
    if (window.__threeReady) start();else window.addEventListener('threeready', start, {
      once: true
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      if (mount.__dispose) mount.__dispose();
    };
  }, []);
  return React.createElement("div", {
    ref: mountRef,
    className: "rs-mount"
  });
}
window.ReceivingScene = ReceivingScene;
window.RS_DUR = RS_DUR;
window.RS_CHAPTERS = RS_CHAPTERS;
})();

/* ---- Process ---- */
(function(){
const STEPS = [{
  n: '01',
  t: 'Pull up. Tap in.',
  s: 'The driver arrives with the shipment and taps his RFID card on the SCAN panel.'
}, {
  n: '02',
  t: 'The dock knows.',
  s: 'The matching shipment shows on the LCD in under 200 ms and the gate approves it.'
}, {
  n: '03',
  t: 'Numbers don’t lie.',
  s: 'The worker sets the box on the scale; the live weight is checked against the order.'
}, {
  n: '04',
  t: 'Green light. Done.',
  s: 'The iPad shows QTY MATCH and the shipment is recorded. A mismatch is logged.'
}];
const fmt = t => {
  if (!isFinite(t) || t < 0) return '00:00';
  const m = Math.floor(t / 60),
    s = Math.floor(t % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};
function Process() {
  const DUR = window.RS_DUR || 26;
  const CH = window.RS_CHAPTERS || [0, 6.6, 9.8, 19.2];
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeRef = React.useRef(0);
  const frameRef = React.useRef(null);
  const userPaused = React.useRef(false);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);
  React.useEffect(() => {
    if (!playing) return undefined;
    let raf = 0,
      last = performance.now(),
      lastUi = 0;
    const tick = now => {
      timeRef.current = (timeRef.current + (now - last) / 1000) % DUR;
      last = now;
      if (now - lastUi > 100) {
        lastUi = now;
        setTime(timeRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  React.useEffect(() => {
    const el = frameRef.current;
    if (!el || reduced || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused.current) setPlaying(true);
      if (!e.isIntersecting) setPlaying(false);
    }, {
      threshold: 0.35
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const toggle = () => {
    userPaused.current = playing;
    setPlaying(!playing);
  };
  const seekTo = t => {
    timeRef.current = Math.max(0, Math.min(DUR - .01, t));
    setTime(timeRef.current);
  };
  const seek = e => {
    const r = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - r.left) / r.width * DUR);
  };
  let chapter = 0;
  CH.forEach((c, i) => {
    if (time >= c) chapter = i;
  });
  return React.createElement("section", {
    className: "section",
    id: "process"
  }, React.createElement("header", {
    className: "section-head center reveal"
  }, React.createElement("span", {
    className: "kicker"
  }, "The process"), React.createElement("h2", {
    className: "display-2"
  }, "Tap. Match. ", React.createElement("em", {
    className: "serif-italic"
  }, "Approve"), ".")), React.createElement("div", {
    className: "video-stage reveal"
  }, React.createElement("div", {
    ref: frameRef,
    className: "video-frame"
  }, React.createElement("div", {
    className: "video-glow"
  }), React.createElement("div", {
    className: "rs-wrap",
    onClick: toggle
  }, window.ReceivingScene ? React.createElement(ReceivingScene, {
    timeRef: timeRef
  }) : null), !playing && React.createElement("button", {
    className: "video-play",
    onClick: () => {
      userPaused.current = false;
      setPlaying(true);
    },
    "aria-label": "Play the process animation"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, React.createElement("path", {
    d: "M8 5v14l11-7z"
  }))), React.createElement("div", {
    className: "video-bar"
  }, React.createElement("button", {
    className: "video-btn",
    onClick: toggle,
    "aria-label": playing ? 'Pause' : 'Play'
  }, playing ? React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, React.createElement("rect", {
    x: "6",
    y: "5",
    width: "4",
    height: "14",
    rx: "1"
  }), React.createElement("rect", {
    x: "14",
    y: "5",
    width: "4",
    height: "14",
    rx: "1"
  })) : React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor"
  }, React.createElement("path", {
    d: "M8 5v14l11-7z"
  }))), React.createElement("div", {
    className: "video-track",
    onClick: seek,
    role: "slider",
    tabIndex: 0,
    "aria-label": "Seek",
    "aria-valuemin": 0,
    "aria-valuemax": DUR,
    "aria-valuenow": Math.round(time),
    onKeyDown: e => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekTo(time + 2);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekTo(time - 2);
      }
    }
  }, CH.slice(1).map(c => React.createElement("span", {
    key: c,
    className: "rs-mark",
    style: {
      left: c / DUR * 100 + '%'
    }
  })), React.createElement("span", {
    className: "video-track-fill",
    style: {
      width: time / DUR * 100 + '%'
    }
  })), React.createElement("span", {
    className: "time"
  }, fmt(time), " / ", fmt(DUR))))), React.createElement("ul", {
    className: "steps"
  }, STEPS.map((s, i) => React.createElement("li", {
    key: s.n,
    className: 'step reveal delay-' + (i + 1) + (i === chapter ? ' is-active' : ''),
    onClick: () => {
      seekTo(CH[i] + .01);
      userPaused.current = false;
      setPlaying(true);
    }
  }, React.createElement("span", {
    className: "step-num"
  }, s.n), React.createElement("div", null, React.createElement("h3", null, s.t), React.createElement("p", null, s.s)), React.createElement("span", {
    className: "step-arrow",
    "aria-hidden": "true"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  })))))), React.createElement("style", null, `
        .video-stage{ margin: 0 auto 56px; width: 100%; max-width: 118vh; }
        .video-frame{
          position:relative;
          border-radius: var(--r-xl);
          overflow:hidden;
          border:1px solid var(--line-2);
          background: var(--surface-3);
          box-shadow: var(--shadow-lg);
          aspect-ratio: 3 / 2;
          isolation:isolate;
        }
        .video-glow{ position:absolute; inset:0; background: radial-gradient(60% 60% at 50% 50%, rgba(124,138,255,.18), transparent 70%); z-index:0; pointer-events:none; }
        .rs-wrap{ position:absolute; inset:0; z-index:1; cursor:pointer; background:#0b0f1c; }
        .rs-wrap > *{ width:100%; height:100%; }
        .rs-wrap canvas{ display:block; width:100% !important; height:100% !important; }
        .video-play{
          position:absolute; inset:0; z-index:3;
          display:grid; place-items:center;
          background: linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.45));
          border:0; cursor: pointer;
        }
        .video-play svg{
          width: 84px; height: 84px; color: #fff;
          filter: drop-shadow(0 8px 24px rgba(124,138,255,.6));
          background: linear-gradient(180deg, var(--accent-2), var(--accent));
          border:1px solid rgba(255,255,255,.4);
          border-radius: 50%;
          padding: 14px;
          transition: transform .25s var(--easing-out);
        }
        .video-play:hover svg{ transform: scale(1.06); }
        .video-bar{
          position:absolute; left:0; right:0; bottom:0; z-index:4;
          display:flex; align-items:center; gap: 14px;
          padding: 12px 16px;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,.65) 60%);
          font: 600 11px/1 var(--font-mono); letter-spacing:.14em; color:#fff;
        }
        .video-btn{ flex:none; width:32px; height:32px; display:grid; place-items:center; border-radius:50%; border:1px solid rgba(255,255,255,.3); background:rgba(255,255,255,.08); color:#fff; cursor:pointer; padding:0; }
        .video-btn svg{ width:14px; height:14px; }
        .video-track{ position:relative; flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,.18); cursor:pointer; }
        .video-track::before{ content:""; position:absolute; left:0; right:0; top:-10px; bottom:-10px; }
        .video-track-fill{ position:absolute; left:0; top:0; bottom:0; border-radius:3px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); pointer-events:none; }
        .rs-mark{ position:absolute; top:-3px; width:2px; height:12px; margin-left:-1px; background:rgba(255,255,255,.55); border-radius:1px; pointer-events:none; }
        .video-bar .time{ flex:none; color: var(--accent-2); }
        .step{ cursor:pointer; }
        .steps{ list-style:none; padding:0; margin:0 auto; max-width: 118vh; display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; }
        .step{
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 10px;
          padding: 22px 22px 24px;
          border-radius: var(--r-lg);
          border: 1px solid var(--line);
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)), var(--surface);
          box-shadow: var(--shadow-sm);
          transition: transform .45s var(--easing-out), border-color .35s var(--easing), box-shadow .45s var(--easing), background .45s var(--easing);
        }
        .step::before{
          content: ""; position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transform: scaleX(0); transition: transform .6s var(--easing-out);
        }
        .step:hover{ transform: translateY(-4px); border-color: var(--line-2); box-shadow: var(--shadow-md); }
        .step:hover::before, .step.is-active::before{ transform: scaleX(1); }
        .step.is-active{ border-color: var(--line-3); background: linear-gradient(180deg, rgba(124,138,255,.10), rgba(124,138,255,.02)), var(--surface); }
        .step-num{
          font-family: var(--font-display); font-size: 34px; line-height: 1; letter-spacing: -0.02em;
          color: transparent; -webkit-text-stroke: 1.2px rgba(124,138,255,.5);
          transition: -webkit-text-stroke-color .35s var(--easing);
        }
        .step:hover .step-num, .step.is-active .step-num{ -webkit-text-stroke-color: var(--accent-2); }
        .step-arrow{ display: none; }
        .step h3{ margin: 0; font-size: 18px; letter-spacing: -0.01em; font-family: var(--font-display); color: var(--text); }
        .step p{ margin: 0; color: var(--muted); font-size: 14.5px; line-height: 1.55; }
        @media (max-width: 1000px){ .steps{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 760px){
          .steps{ grid-template-columns: 1fr; }
          .step{ padding: 18px 20px; }
          .video-frame{ aspect-ratio: 4 / 3; }
          .video-bar{ gap:10px; padding:10px 12px; }
        }
      `));
}
window.Process = Process;
})();

/* ---- Explorer ---- */
(function(){
const COMPONENTS = {
  panel: {
    name: 'SCAN Panel',
    desc: 'The face of the device. Where the driver taps.',
    role: 'Marks the scan zone and houses the LCD window so the driver always knows where to place the card.',
    specs: [['Finish', 'Matte black ABS'], ['Marking', 'Laser-etched'], ['Window', 'Anti-glare LCD']]
  },
  lcd: {
    name: 'LCD 16×2',
    desc: 'A small two-line display.',
    role: 'Shows shipment info and system status in real time — driver name, scan result, approve prompt.',
    specs: [['Type', 'HD44780'], ['Format', '16 × 2 chars'], ['Backlight', 'Blue LED']]
  },
  rfid: {
    name: 'RC522 Reader',
    desc: 'The 13.56 MHz RFID module.',
    role: 'Reads the card or fob ID the instant it touches the panel.',
    specs: [['Standard', 'MIFARE 13.56 MHz'], ['Bus', 'SPI'], ['Range', '3–5 cm']]
  },
  mcu: {
    name: 'Arduino UNO R4',
    desc: 'The brain of the device.',
    role: 'Reads the RFID, talks to the dashboard, and drives the LCD on every tap.',
    specs: [['MCU', 'Renesas RA4M1'], ['Clock', '48 MHz'], ['I/O', 'USB · SPI · I²C · UART']]
  },
  wires: {
    name: 'Wiring Harness',
    desc: 'Power and signal lines.',
    role: 'Keeps the boards connected with clean, reliable signal between the MCU, reader, and display.',
    specs: [['Gauge', '22 AWG'], ['Bus', 'SPI · 5 V · GND']]
  },
  battery: {
    name: '9 V Battery',
    desc: 'Backup power.',
    role: 'Keeps the device alive through short power dips so the gate never stalls mid-shipment.',
    specs: [['Cell', '9 V alkaline'], ['Use', 'Brownout backup']]
  },
  enclosure: {
    name: 'Enclosure',
    desc: 'The outer case.',
    role: 'Protects the electronics and presents a clean, branded surface to the driver.',
    specs: [['Material', 'ABS composite'], ['Finish', 'Matte black'], ['Mount', 'Counter / wall']]
  },
  card: {
    name: 'RFID Card',
    desc: "A driver's credential, in card form.",
    role: 'Each card is bound to one driver — tap it, and the matching shipment shows up.',
    specs: [['Type', 'MIFARE Classic 1K'], ['Frequency', '13.56 MHz']]
  },
  fob: {
    name: 'RFID Keyfob',
    desc: 'Same credential, in keyring form.',
    role: "A drop-in alternative for drivers who'd rather carry a fob than a card.",
    specs: [['Type', 'MIFARE Classic'], ['Form', 'Keyring fob']]
  }
};
const ORDER = ['panel', 'lcd', 'rfid', 'mcu', 'wires', 'battery', 'enclosure', 'card', 'fob'];
const HOTSPOTS = [{
  id: 'panel',
  left: '10%',
  top: '62%'
}, {
  id: 'lcd',
  left: '22%',
  top: '47%'
}, {
  id: 'rfid',
  left: '33%',
  top: '47%'
}, {
  id: 'mcu',
  left: '48%',
  top: '43%'
}, {
  id: 'wires',
  left: '61%',
  top: '33%'
}, {
  id: 'battery',
  left: '70%',
  top: '42%'
}, {
  id: 'enclosure',
  left: '87%',
  top: '30%'
}, {
  id: 'card',
  left: '47%',
  top: '74%'
}, {
  id: 'fob',
  left: '60%',
  top: '79%'
}];
function Explorer() {
  const [active, setActive] = React.useState(null);
  const stageRef = React.useRef(null);
  const step = delta => {
    if (!active) {
      setActive(ORDER[0]);
      return;
    }
    const i = ORDER.indexOf(active);
    setActive(ORDER[(i + delta + ORDER.length) % ORDER.length]);
  };
  const c = active ? COMPONENTS[active] : null;
  const idx = active ? ORDER.indexOf(active) + 1 : 0;
  const activeHot = HOTSPOTS.find(h => h.id === active);
  return React.createElement("section", {
    className: "section",
    id: "components"
  }, React.createElement("header", {
    className: "section-head center reveal"
  }, React.createElement("span", {
    className: "kicker"
  }, "Inside the device"), React.createElement("h2", {
    className: "display-2"
  }, "Nine parts. ", React.createElement("em", {
    className: "serif-italic"
  }, "No mystery"), "."), React.createElement("p", {
    className: "lede"
  }, "Every part, what it does, and its spec.")), React.createElement("div", {
    className: "explorer"
  }, React.createElement("div", {
    ref: stageRef,
    className: 'explorer-stage' + (active ? ' has-active' : '')
  }, React.createElement("img", {
    className: "exploded",
    src: "./exploded.png",
    alt: "Exploded view of the Verigate device"
  }), activeHot && React.createElement("span", {
    className: "spotlight",
    style: {
      left: activeHot.left,
      top: activeHot.top
    }
  }), HOTSPOTS.map(h => React.createElement("button", {
    key: h.id,
    className: 'hot' + (active === h.id ? ' active' : ''),
    "data-id": h.id,
    style: {
      left: h.left,
      top: h.top
    },
    onClick: () => setActive(h.id),
    "aria-label": COMPONENTS[h.id].name
  }, React.createElement("span", {
    className: "hot-pin"
  }), React.createElement("span", {
    className: "hot-label"
  }, COMPONENTS[h.id].name)))), React.createElement("aside", {
    className: "explorer-panel"
  }, !active && React.createElement("div", {
    className: "panel-default"
  }, React.createElement("span", {
    className: "panel-eyebrow"
  }, "Pick a component"), React.createElement("h3", null, "The whole device, demystified."), React.createElement("p", {
    className: "panel-sub"
  }, "Tap a pin on the diagram or pick a part below."), React.createElement("ul", {
    className: "quick-rail"
  }, ORDER.map(id => React.createElement("li", {
    key: id
  }, React.createElement("button", {
    className: "qr",
    onClick: () => setActive(id)
  }, COMPONENTS[id].name))))), active && c && React.createElement("div", {
    className: "panel-detail"
  }, React.createElement("span", {
    className: "panel-eyebrow"
  }, String(idx).padStart(2, '0'), " / ", String(ORDER.length).padStart(2, '0'), " \xB7 Component"), React.createElement("h3", null, c.name), React.createElement("p", {
    className: "panel-sub"
  }, c.desc), React.createElement("div", {
    className: "panel-block"
  }, React.createElement("span", {
    className: "block-label"
  }, "Role"), React.createElement("p", null, c.role)), React.createElement("ul", {
    className: "spec-list"
  }, c.specs.map(([k, v]) => React.createElement("li", {
    key: k
  }, React.createElement("b", null, k), React.createElement("span", null, v)))), React.createElement("div", {
    className: "panel-controls"
  }, React.createElement("button", {
    className: "mini",
    onClick: () => step(-1)
  }, "\u2190 Prev"), React.createElement("button", {
    className: "mini",
    onClick: () => step(+1)
  }, "Next \u2192"), React.createElement("button", {
    className: "mini close",
    onClick: () => setActive(null)
  }, "Close"))))), React.createElement("style", null, `

        .explorer{ display:grid; grid-template-columns: 1.55fr 1fr; gap: 20px; align-items: stretch; }
        .explorer-stage{
          position:relative;
          border-radius: var(--r-xl);
          border:1px solid var(--line);
          background:
            radial-gradient(640px 320px at 50% 58%, rgba(124,138,255,.18), transparent 65%),
            linear-gradient(180deg, #0C0F1F, #060814);
          overflow:hidden;
          aspect-ratio: 666 / 375;
          min-height: 360px;
          isolation: isolate;
          box-shadow: var(--shadow-md);
        }
        .exploded{ position:absolute; inset:0; width:100%; height:100%; object-fit: contain; transition: opacity .35s ease; }
        .explorer-stage.has-active .exploded{ opacity:.35; }
        .hot{ position:absolute; width:44px; height:44px; border-radius:50%; transform: translate(-50%,-50%); padding:0; outline:none; z-index:4; display:flex; align-items:center; justify-content:center; transition: transform .25s var(--easing-out), filter .25s ease; }
        .hot-pin{
          position: relative;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: linear-gradient(180deg, #fff 0%, var(--accent-2) 100%);
          box-shadow:
            0 0 0 4px rgba(124,138,255,.18),
            0 0 14px rgba(167,139,250,.7),
            0 2px 6px rgba(0,0,0,.4);
          transition: transform .25s var(--easing-out), box-shadow .25s ease;
        }
        .hot-pin::before{ content:""; position:absolute; inset:-6px; border-radius:50%; border:1px solid rgba(124,138,255,.55); opacity:0; transition: opacity .25s ease; }
        .hot.active .hot-pin{
          transform: scale(1.25);
          background: linear-gradient(180deg, #fff, var(--accent));
          box-shadow:
            0 0 0 6px rgba(124,138,255,.22),
            0 0 22px rgba(167,139,250,.95),
            0 2px 6px rgba(0,0,0,.5);
        }
        .hot.active .hot-pin::before{ opacity:1; animation: hotPulse 2s ease-out infinite; }
        @keyframes hotPulse{ 0%{ transform: scale(.7); opacity:.9; } 100%{ transform: scale(2.4); opacity:0; } }
        .hot:hover .hot-pin{ transform: scale(1.18); }
        .explorer-stage.has-active .hot:not(.active){ opacity:.45; }
        .hot-label{
          position:absolute; bottom: calc(100% + 2px); left: 50%;
          transform: translate(-50%, 6px); white-space: nowrap;
          font: 600 11px/1 var(--font-mono);
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--text);
          padding: 6px 9px;
          border-radius: 999px;
          border: 1px solid var(--line-2);
          background: rgba(20,23,43,.92);
          box-shadow: var(--shadow-md);
          opacity:0; pointer-events: none;
          transition: opacity .2s ease, transform .25s var(--easing-out);
        }
        .hot:hover .hot-label, .hot.active .hot-label{ opacity:1; transform: translate(-50%, 0); }
        .spotlight{
          position:absolute; pointer-events:none; z-index:3;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(124,138,255,.22), transparent 72%);
          border:1px dashed rgba(167,139,250,.5);
          transform: translate(-50%,-50%);
        }

        .explorer-panel{
          position: relative;
          border-radius: var(--r-xl);
          border:1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          padding: 30px;
          display:flex; flex-direction:column; gap: 12px;
          min-height: 480px;
          box-shadow: var(--shadow-md);
        }
        .panel-eyebrow{
          font: 600 11px/1 var(--font-mono);
          letter-spacing:.22em; text-transform:uppercase;
          color: var(--accent);
          display:inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(124,138,255,.06);
          width: max-content;
        }
        .explorer-panel h3{ margin: 12px 0 4px; font-family: var(--font-display); font-size: clamp(22px, 2vw, 28px); line-height: 1.15; letter-spacing: -0.018em; color: var(--text); }
        .panel-sub{ color: var(--text-2); margin: 6px 0 14px; line-height: 1.6; }
        .panel-block{
          border:1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          background: var(--surface-2);
          margin-bottom: 14px;
        }
        .block-label{ font: 600 10.5px/1 var(--font-mono); letter-spacing:.18em; text-transform:uppercase; color: var(--muted); display:block; margin-bottom: 6px; }
        .panel-block p{ margin:0; color: var(--text-2); font-size: 14.5px; line-height: 1.55; }
        .spec-list{ list-style:none; margin:0 0 12px; padding:0; display:grid; gap:8px; }
        .spec-list li{
          display:flex; justify-content:space-between; gap:14px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--surface-2);
          border:1px solid var(--line);
          font-size: 13.5px;
          color: var(--text);
        }
        .spec-list li b{ font: 600 10.5px/1 var(--font-mono); letter-spacing:.18em; text-transform:uppercase; color: var(--muted); font-weight:600; }
        .quick-rail{ list-style:none; padding:0; margin: 18px 0 0; display:flex; flex-wrap:wrap; gap: 6px; }
        .qr{
          font: 600 11px/1 var(--font-mono);
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--muted);
          padding: 8px 11px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--surface-2);
          cursor: pointer;
          transition: all .2s var(--easing);
        }
        .qr:hover{
          color: var(--accent);
          border-color: var(--line-3);
          background: rgba(124,138,255,.06);
        }
        .panel-controls{ margin-top:auto; display:flex; gap:8px; }
        .mini{
          padding:10px 14px;
          border-radius: 999px;
          border:1px solid var(--line-2);
          color: var(--text);
          background: var(--surface);
          font-size: 13px;
          transition: all .2s var(--easing);
          cursor: pointer;
        }
        .mini:hover{
          background: var(--surface-2);
          border-color: var(--line-3);
          color: var(--accent);
        }
        .mini.close{ margin-left:auto; }
        @media (max-width: 980px){ .explorer{ grid-template-columns: 1fr; } .explorer-stage{ min-height: 320px; } }
      `));
}
window.Explorer = Explorer;
})();

/* ---- Contact ---- */
(function(){
function Contact() {
  return React.createElement("section", {
    className: "section contact",
    id: "contact"
  }, React.createElement("div", {
    className: "contact-card reveal"
  }, React.createElement("div", {
    className: "contact-bloom",
    "aria-hidden": "true"
  }), React.createElement("div", {
    className: "contact-grid",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "kicker"
  }, React.createElement("span", {
    className: "dot"
  }), "Get in touch"), React.createElement("h2", {
    className: "display-2"
  }, "Every dock deserves ", React.createElement("em", {
    className: "serif-italic grad-text"
  }, "a VeriGate"), "."), React.createElement("p", {
    className: "lede center"
  }, "Contact Owner for More Details."), React.createElement("a", {
    href: "https://www.linkedin.com/in/osamasunaallah/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn primary big contact-cta"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: "18",
    height: "18",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"
  })), "Connect on LinkedIn", React.createElement("svg", {
    className: "contact-cta-arrow",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    width: "16",
    height: "16",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M5 12h14M13 6l6 6-6 6"
  })))), React.createElement("style", null, `
        .contact{ padding-bottom: clamp(60px, 8vw, 110px); }
        .contact-card{
          position:relative; text-align:center;
          padding: clamp(48px, 7vw, 92px) clamp(24px, 4vw, 60px);
          border-radius: var(--r-2xl);
          border:1px solid var(--line);
          overflow:hidden;
          background:
            radial-gradient(900px 360px at 50% -20%, rgba(124,138,255,.30), transparent 60%),
            radial-gradient(900px 360px at 50% 120%, rgba(167,139,250,.22), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          box-shadow: var(--shadow-lg);
          display: flex; flex-direction: column; align-items: center;
        }
        .contact-bloom{
          position: absolute;
          left: 50%; top: 0;
          width: 640px; height: 640px;
          transform: translate(-50%, -55%);
          background: radial-gradient(closest-side, rgba(124,138,255,.28), rgba(124,138,255,.08) 55%, transparent 75%);
          pointer-events: none;
        }
        @keyframes contactBloom{
          0%, 100%{ transform: translate(-50%, -55%) scale(1); opacity: .85; }
          50%{ transform: translate(-50%, -55%) scale(1.06); opacity: 1; }
        }
        .contact-grid{
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%);
          pointer-events: none;
        }
        .contact-card > *:not(.contact-bloom):not(.contact-grid){ position: relative; z-index: 1; }
        .contact-cta{ position: relative; }
        .contact-cta-arrow{ transition: transform .35s var(--easing-spring); margin-left: 2px; }
        .contact-cta:hover .contact-cta-arrow{ transform: translateX(5px); }
        .contact-card .kicker{
          display:inline-flex; align-items:center; gap:10px;
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .22em; text-transform: uppercase;
          color: var(--muted);
          padding: 8px 12px;
          border:1px solid var(--line);
          border-radius: 999px;
          background: rgba(255,255,255,.04);
          margin: 0 auto;
        }
        .contact-card .kicker .dot{
          width:8px; height:8px; border-radius:50%;
          background: var(--accent);
          box-shadow: 0 0 0 4px rgba(124,138,255,.14), 0 0 18px rgba(124,138,255,.7);
        }
        .contact-card .display-2{
          font-size: clamp(34px, 5.4vw, 72px);
          line-height: 1.02; letter-spacing: -0.032em;
          margin: 20px auto 28px;
          max-width: 22ch;
          color: var(--text);
          text-wrap: balance;
        }
        .contact-card .display-2 em.grad-text{
          background: linear-gradient(180deg, #FFFFFF 0%, #C5CAF8 55%, #A78BFA 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .contact-card .lede.center{ margin: 0 auto 30px; text-align: center; max-width: 60ch; font-size: clamp(16px, 1.2vw, 19px); line-height: 1.6; color: var(--text-2); }
      `));
}
window.Contact = Contact;
})();

/* ---- Footer ---- */
(function(){
function Footer() {
  const year = new Date().getFullYear();
  return React.createElement("footer", {
    className: "site-footer"
  }, React.createElement("div", {
    className: "site-footer-inner"
  }, React.createElement("div", {
    className: "site-footer-brand"
  }, React.createElement("span", {
    className: "footer-mark"
  }, React.createElement("span", {
    className: "footer-dot"
  }), "Verigate"), React.createElement("span", {
    className: "footer-meta"
  }, "IoT Receiving Device \xB7 One source of truth")), React.createElement("div", {
    className: "site-footer-meta"
  }, React.createElement("span", null, "\xA9 ", year, " Osama Sunaallah"), React.createElement("span", {
    className: "footer-sep"
  }, "\xB7"), React.createElement("a", {
    href: "https://www.linkedin.com/in/osamasunaallah/",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "LinkedIn"))), React.createElement("style", null, `
        .site-footer{
          position: relative;
          z-index: 1;
          width: min(1280px, calc(100% - 40px));
          margin: clamp(60px, 10vw, 120px) auto 32px;
          padding: 28px 0 0;
          border-top: 1px solid var(--line);
        }
        .site-footer-inner{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .site-footer-brand{
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .footer-mark{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        .footer-dot{
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px rgba(124,138,255,.14), 0 0 12px rgba(124,138,255,.6);
          animation: footerPulse 2.6s ease-in-out infinite;
        }
        @keyframes footerPulse{ 50%{ box-shadow: 0 0 0 5px rgba(124,138,255,.05), 0 0 16px rgba(124,138,255,.85); } }
        .footer-meta{
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .site-footer-meta{
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .site-footer-meta a{
          color: var(--muted);
          transition: color .25s var(--easing);
        }
        .site-footer-meta a:hover{ color: var(--accent); }
        .footer-sep{ opacity: .4; }
        .footer-mono{
          color: var(--accent);
          opacity: .75;
        }
        @media (max-width: 720px){
          .site-footer-inner{ flex-direction: column; align-items: flex-start; }
          .footer-meta{ display: none; }
        }
      `));
}
window.Footer = Footer;
})();

/* ---- App ---- */
(function(){
function App() {
  const [introMounted, setIntroMounted] = React.useState(true);
  const [introKey, setIntroKey] = React.useState(0);
  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.12
    });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  React.useEffect(() => {
    const onReplay = () => {
      setIntroKey(k => k + 1);
      setIntroMounted(true);
    };
    window.addEventListener('verigate-replay-intro', onReplay);
    return () => window.removeEventListener('verigate-replay-intro', onReplay);
  }, []);
  return React.createElement(React.Fragment, null, introMounted && React.createElement(PhoenixIntro, {
    key: introKey,
    onDone: () => setIntroMounted(false)
  }), React.createElement(Nav, null), React.createElement("main", null, React.createElement(HeroPhoto, null), React.createElement(Architecture, null), React.createElement("div", {
    className: "div-glow"
  }), React.createElement(Capabilities, null), React.createElement(Problems, null), React.createElement(Solution, null), React.createElement(Process, null), React.createElement(Explorer, null), React.createElement(Contact, null)), React.createElement(Footer, null));
}
if (!window.__verigateRoot) {
  window.__verigateRoot = ReactDOM.createRoot(document.getElementById('root'));
  window.__verigateRoot.render(React.createElement(App, null));
}
})();
