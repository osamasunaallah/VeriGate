/* PhoenixIntro — one-shot cinematic opening.
   ============================================================
   · Loads ./phoenix-bird.glb via the same Three.js + GLTFLoader
     bootstrap used by DeviceWithLCD (window.THREE / window.GLTFLoader).
   · Plays the model's "Take 001" wing-flap animation with an
     AnimationMixer.
   · Sweeps a LARGE phoenix horizontally from off-screen LEFT to
     off-screen RIGHT across the viewport. Head points in the
     motion direction (+X) so the bird isn't flying backward.
     Stays close to the camera at constant scale so it covers
     most of the screen while staying fully detailed.
   · The last 600 ms cross-fade the canvas out as the bird exits
     stage-right. After the sequence completes, the whole component
     unmounts — the Three.js renderer is disposed, the canvas
     removed, and the RAF loop is cancelled. Nothing keeps running.
   · Guarantees on first paint:
       - Skipped entirely under prefers-reduced-motion
       - Skipped on re-visit within the same session (sessionStorage
         flag) so you don't re-trigger it on every refresh
       - Skipped if Three.js fails to load within 900 ms → CSS
         fallback runs instead (logo sweeps from left to right via
         transform+opacity only — GPU-friendly)
   · DURATION: total ~5.2 s. Lazy: the GLB only starts loading on
     mount, so the rest of the page renders immediately. */

const INTRO_DURATION_MS = 5200;        // slower so the bird is easy to watch
const SETTLE_DURATION_MS = 600;        // last phase = canvas fades while bird exits right
const SESSION_KEY = 'verigate_intro_played';
// Add ?intro=1 to the URL to force-replay (useful while iterating).
const FORCE_REPLAY = (typeof location !== 'undefined') && location.search.indexOf('intro=1') >= 0;

function PhoenixIntro({ onDone }){
  const hostRef = React.useRef(null);
  const fallbackRef = React.useRef(null);
  const [phase, setPhase] = React.useState('init');    // init -> flying -> settling -> done
  const [usingFallback, setUsingFallback] = React.useState(false);

  React.useEffect(() => {
    // Reduced motion -> skip immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      onDone && onDone();
      return;
    }
    // Already played this session -> skip (bypassed when ?intro=1).
    try {
      if (!FORCE_REPLAY && sessionStorage.getItem(SESSION_KEY)) {
        onDone && onDone();
        return;
      }
    } catch(_){}
    // Belt-and-braces: never let two instances race against each other
    // (Babel-standalone can occasionally re-execute inline scripts).
    if (window.__phxIntroRunning){
      onDone && onDone();
      return;
    }
    window.__phxIntroRunning = true;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch(_){}

    let alive = true;
    let raf = 0;
    let renderer, scene, camera, model, mixer, clock;
    let threeFailed = false;
    let threeFailTimer = setTimeout(() => {
      if (alive && !window.__threeReady){
        threeFailed = true;
        setUsingFallback(true);
      }
    }, 900);

    const finish = () => {
      if (!alive) return;
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      if (renderer){
        renderer.dispose();
        if (renderer.domElement.parentNode){
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      if (scene){
        scene.traverse((obj) => {
          if (obj.isMesh){
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material){
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
      if (!THREE || !GLTFLoader || !host){
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;';
      host.appendChild(renderer.domElement);

      // Bright lighting so the phoenix's colored textures pop
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const key = new THREE.DirectionalLight(0xfff0d8, 1.6);
      key.position.set(2, 2, 3);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xa8b5ff, 0.8);
      rim.position.set(-2, 1, -1);
      scene.add(rim);

      clock = new THREE.Clock();

      const loader = new GLTFLoader();
      const startedAt = performance.now();

      loader.load(
        './phoenix-bird.glb?v=30',
        (gltf) => {
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

          if (gltf.animations && gltf.animations.length){
            mixer = new THREE.AnimationMixer(model);
            const fullClip = gltf.animations[0];
            // Take 001 (384 frames) split into 4 cycles; each paired with its own flight path.
            // Model naturally faces +X at rotation.y = 0.
            // rotY =       0.22 → head faces +X (motion to the right) with 3/4 tilt toward camera
            // rotY = π   - 0.22 → head faces -X (motion to the left)  with 3/4 tilt toward camera
            // Path: [sFrame, eFrame, sx, sy, ex, ey, rotY, label]
            // y positions kept negative so the bird flies BELOW the sticky nav
            // (camera FOV 35° at z=6 → top of viewport ≈ +1.9; nav bottom ≈ +1.5).
            const PATHS = [
              [  0,  96, -7.5, -1.2,  7.5, -1.2,           0.22, 'L→R level'],
              [ 96, 192,  7.5, -1.0, -7.5, -1.0, Math.PI - 0.22, 'R→L level'],
              [192, 288, -7.5, -1.6,  7.5, -0.5,           0.22, 'L→R climb'],
              [288, 384,  7.5, -0.5, -7.5, -1.6, Math.PI - 0.22, 'R→L dive'],
            ];
            const picked = PATHS[Math.floor(Math.random() * PATHS.length)];
            const sFrame = picked[0], eFrame = picked[1];
            const subClip = THREE.AnimationUtils.subclip(fullClip, picked[7], sFrame, eFrame, 24);
            const action = mixer.clipAction(subClip);
            action.loop = THREE.LoopRepeat;
            action.timeScale = subClip.duration / (INTRO_DURATION_MS / 1000);
            action.play();
            model.userData.path = {
              sx: picked[2], sy: picked[3],
              ex: picked[4], ey: picked[5],
              rotY: picked[6], label: picked[7],
            };
            console.log('[PhoenixIntro] picked path:', picked[7]);
          }

          scene.add(model);
          setPhase('flying');
        },
        undefined,
        (err) => {
          console.error('[PhoenixIntro] GLB load FAILED', err);
          if (alive){
            threeFailed = true;
            setUsingFallback(true);
            // Don't call finish() here â€” let the fallback play its own animation
          }
        }
      );

      // Animation loop â€” controls the flight path AND drives the wing flap.
      const animate = () => {
        if (!alive) return;
        raf = requestAnimationFrame(animate);
        const now = performance.now();
        const t = Math.min(1, (now - startedAt) / INTRO_DURATION_MS);
        const settleT = Math.max(0, (now - startedAt - (INTRO_DURATION_MS - SETTLE_DURATION_MS)) / SETTLE_DURATION_MS);

        if (mixer) mixer.update(clock.getDelta());

        if (model){
          // Flight path: BIG horizontal sweep, off-screen LEFT -> off-screen RIGHT.
          // The bird stays close to camera at constant scale so it covers most
          // of the viewport while staying fully detailed.
          //
          // Easing: a gentle ease-out (fast in the middle, soft at the edges)
          // keeps the bird visible for most of the duration without the
          // strong "linger at edges" feel of ease-in-out-cubic.
          const e = easeOutSine(t);
          const p = model.userData.path || { sx: -7, sy: -0.5, ex: 7, ey: -0.5, rotY: 0.22 };
          const zFloat = Math.sin(t * Math.PI * 1.0) * 0.15;
          const yBob   = Math.sin(t * Math.PI * 2.5) * 0.08;

          model.position.x = p.sx + (p.ex - p.sx) * e;
          model.position.y = p.sy + (p.ey - p.sy) * e + yBob;
          model.position.z = 0.6 + zFloat;

          model.rotation.y = p.rotY;
          // When model is flipped 180° (R→L paths), local X is inverted — pitch needs sign flip.
          const xSign = (p.ex >= p.sx) ? 1 : -1;
          model.rotation.z = Math.sin(t * Math.PI * 2.0) * 0.09 * xSign;
          const climbRate = (p.ey - p.sy) / 14;
          model.rotation.x = (0.05 + Math.sin(t * Math.PI * 1.5) * 0.04 - climbRate * 0.35) * xSign;

          const fit = model.userData.fitScale || 1;
          model.scale.setScalar(fit * 0.8);

          // Final settle: fade the canvas out as the bird exits stage-right.
          if (settleT > 0){
            renderer.domElement.style.opacity = String(1 - settleT);
          }
        }

        renderer.render(scene, camera);

        if (t >= 1){ finish(); }
      };
      animate();
    };

    // Bootstrap â€” wait for Three.js
    if (window.__threeReady){
      startThreeIntro();
    } else {
      window.addEventListener('threeready', startThreeIntro, { once: true });
    }

    return () => {
      alive = false;
      window.__phxIntroRunning = false;
      clearTimeout(threeFailTimer);
      window.removeEventListener('threeready', startThreeIntro);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // CSS-only fallback: a logo image swoops from right â†’ upper-left â†’ fades into nav
  if (usingFallback){
    return (
      <div className="phx-intro-fallback" ref={fallbackRef} aria-hidden="true">
        <img
          src="./verigate-logo.png?v=31"
          alt=""
          className="phx-intro-fallback-img"
          onAnimationEnd={() => { onDone && onDone(); }}
        />
        <style>{`
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
        `}</style>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="phx-intro-host"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        pointerEvents: 'none',
        opacity: phase === 'done' ? 0 : 1
      }}
    />
  );
}

function easeInOutCubic(t){
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// Gentle ease-out — bird moves quickly through the entry, glides across the
// middle, and decelerates softly as it exits. Better for "watch the bird"
// than ease-in-out which clusters time at both edges.
function easeOutSine(t){
  return Math.sin((t * Math.PI) / 2);
}

window.PhoenixIntro = PhoenixIntro;
