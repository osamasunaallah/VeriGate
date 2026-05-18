/* DeviceWithLCD — self-contained 3D product component.
   ============================================================
   · Loads ./verigate-device.glb via the GLTFLoader bootstrapped in
     index.html (window.THREE, window.GLTFLoader).
   · Finds the mesh named "LCD_Screen_Plane" in the loaded scene.
   · Builds an HTMLCanvasElement that draws the LCD interface
     (gradient background, dot-matrix grid, two text lines, blinking
     cursor, animated scan beam) every frame, wraps it as a
     THREE.CanvasTexture, and assigns it as the LCD_Screen_Plane
     material's map.
   · The whole device — body, switch, AND the LCD plane — rotates as
     one object because the LCD is a child mesh of the model's root.
     No floating divs; the screen interface is baked into the model's
     texture and therefore stays glued in 3D space.
   · Props:
       - activeChapter (number 0..N-1): which chapter LCD content to show
       - chapters (array): chapter data ({ lcdLine1, lcdLine2, state })
       - rotation ({ y, x }): optional model rotation (radians)
   · Pure React-managed Three.js — no R3F dependency required for the
     no-build Babel-standalone setup, but the component encapsulates the
     full WebGL lifecycle (mount → render loop → unmount disposal). */

function DeviceWithLCD({
  activeChapter = 0,
  chapters = [],
  rotation,
  className = ''
}){
  const mountRef = React.useRef(null);
  const stateRef = React.useRef({});
  // Latest props for the animation loop (avoids restarting the scene)
  const propsRef = React.useRef({ activeChapter, chapters, rotation });
  React.useEffect(() => {
    propsRef.current = { activeChapter, chapters, rotation };
  }, [activeChapter, chapters, rotation]);

  React.useEffect(() => {
    let alive = true;
    let raf = 0;

    const start = () => {
      const THREE = window.THREE;
      const GLTFLoader = window.GLTFLoader;
      if (!THREE || !GLTFLoader || !mountRef.current) {
        // Re-try when threeready fires
        return;
      }

      const mount = mountRef.current;
      const initialW = Math.max(mount.clientWidth, 200);
      const initialH = Math.max(mount.clientHeight, 200);

      // ----- Scene + camera + renderer -----
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, initialW / initialH, 0.001, 50);
      // Roughly match the original Blender camera angle (front + right + slightly above)
      camera.position.set(0.18, 0.04, 0.20);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(initialW, initialH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';

      // ----- Lights — 3-point setup -----
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

      // ----- LCD canvas (drawn each frame, used as a CanvasTexture) -----
      // 5:1 aspect ratio matches the model's 49.14mm × 9.72mm LCD glass plane
      const LCD_W = 1024, LCD_H = 220;
      const lcdCanvas = document.createElement('canvas');
      lcdCanvas.width = LCD_W;
      lcdCanvas.height = LCD_H;
      const lcdCtx = lcdCanvas.getContext('2d');
      const lcdTexture = new THREE.CanvasTexture(lcdCanvas);
      if (THREE.SRGBColorSpace) lcdTexture.colorSpace = THREE.SRGBColorSpace;
      lcdTexture.flipY = true;          // common GLB convention
      lcdTexture.anisotropy = 8;
      lcdTexture.minFilter = THREE.LinearFilter;
      lcdTexture.magFilter = THREE.LinearFilter;

      let lcdMesh = null;
      let model = null;

      // ----- Load the GLB -----
      const loader = new GLTFLoader();
      loader.load(
        './verigate-device.glb?v=21',
        (gltf) => {
          if (!alive) return;
          model = gltf.scene;

          // Center model on origin so rotations look natural
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          // Fit the model into the camera frustum: scale so its largest
          // dimension fills the viewport reasonably at the camera distance.
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetMax = 0.10;   // device should be ~10 cm in scene units
          const fitScale = targetMax / maxDim;
          model.scale.setScalar(fitScale);

          // Find the LCD_Screen_Plane and apply the canvas texture
          model.traverse((obj) => {
            if (!obj.isMesh) return;
            if (obj.name === 'LCD_Screen_Plane') {
              lcdMesh = obj;
              const lcdMat = new THREE.MeshBasicMaterial({
                map: lcdTexture,
                toneMapped: false,           // keep the LCD bright through tone mapping
                transparent: false
              });
              lcdMesh.material = lcdMat;
            }
          });

          scene.add(model);
          stateRef.current.model = model;
          stateRef.current.lcdMesh = lcdMesh;
        },
        undefined,
        (err) => { console.error('GLB load error:', err); }
      );

      // ----- Resize -----
      const onResize = () => {
        const w = Math.max(mount.clientWidth, 200);
        const h = Math.max(mount.clientHeight, 200);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      // Observe parent size too (sticky-scroll layout)
      let resizeObs = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObs = new ResizeObserver(onResize);
        resizeObs.observe(mount);
      }

      // ----- Pointer drag rotation (user can spin the device) -----
      let dragging = false;
      let dragStartX = 0, dragStartY = 0;
      let dragYaw = 0, dragPitch = 0;          // current values
      let dragYawT = 0, dragPitchT = 0;        // target values
      let savedYaw = 0, savedPitch = 0;
      const onPointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        dragStartX = e.clientX; dragStartY = e.clientY;
        savedYaw = dragYaw; savedPitch = dragPitch;
        try { renderer.domElement.setPointerCapture(e.pointerId); } catch(_){}
      };
      const onPointerMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        // 0.3° per pixel, clamped — natural feel without losing the device
        dragYawT   = savedYaw   + Math.max(-1.6, Math.min(1.6, dx * 0.005));
        dragPitchT = savedPitch + Math.max(-0.8, Math.min(0.8, dy * 0.004));
      };
      const onPointerUp = () => {
        if (!dragging) return;
        dragging = false;
        // Spring back to 0 over a few frames
        dragYawT = 0;
        dragPitchT = 0;
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // ----- Animation loop — heavily throttled for performance -----
      // - Three.js renderer.render() is capped at 30 fps (every other RAF)
      // - LCD canvas redraw is capped at 15 fps + on chapter/state change
      // The model's idle rotation is slow enough that 30fps reads as smooth
      // and we save ~50% of GPU cycles vs an unthrottled loop.
      let lastSceneTime = 0;
      let lastLcdTime = 0;
      let lastChapterIdx = -1;
      const SCENE_INTERVAL = 1000 / 30;
      const LCD_INTERVAL = 1000 / 15;
      const animate = (t) => {
        if (!alive) return;
        raf = requestAnimationFrame(animate);
        const tMs = t || performance.now();

        const { activeChapter, chapters, rotation } = propsRef.current;
        const chap = chapters && chapters.length ? chapters[Math.max(0, Math.min(chapters.length - 1, activeChapter))] : {};

        // Redraw LCD canvas only periodically — OR immediately on chapter change
        const chapterChanged = activeChapter !== lastChapterIdx;
        if (chapterChanged || tMs - lastLcdTime > LCD_INTERVAL){
          drawLCD(lcdCtx, lcdCanvas, chap, tMs);
          lcdTexture.needsUpdate = true;
          lastLcdTime = tMs;
          lastChapterIdx = activeChapter;
        }

        // Only do scene work + render on the 30fps tick
        if (tMs - lastSceneTime < SCENE_INTERVAL) return;
        lastSceneTime = tMs;

        if (model){
          dragYaw   += (dragYawT   - dragYaw)   * 0.16;
          dragPitch += (dragPitchT - dragPitch) * 0.16;
          const idle = Math.sin(tMs * 0.0005) * 0.08;
          const baseY = (rotation && typeof rotation.y === 'number') ? rotation.y : 0;
          const baseX = (rotation && typeof rotation.x === 'number') ? rotation.x : 0;
          model.rotation.y = baseY + idle + dragYaw;
          model.rotation.x = baseX + dragPitch * 0.6;
          model.position.y = Math.sin(tMs * 0.0009) * 0.0025;
        }

        renderer.render(scene, camera);
      };
      animate(0);

      stateRef.current = {
        ...stateRef.current,
        renderer, scene, camera, lcdCanvas, lcdCtx, lcdTexture,
        onResize, resizeObs,
        onPointerDown, onPointerMove, onPointerUp
      };
    };

    // Three.js may not be ready yet (module loads async). Wait for the event.
    if (window.__threeReady) start();
    else window.addEventListener('threeready', start, { once: true });

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      const s = stateRef.current;
      if (s.onResize) window.removeEventListener('resize', s.onResize);
      if (s.resizeObs) s.resizeObs.disconnect();
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
        s.scene.traverse((obj) => {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
              else obj.material.dispose && obj.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={'dwl-mount ' + (className || '')}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
        cursor: 'grab'
      }}
    />
  );
}

/* drawLCD — pixel-perfect 2D rendering of the LCD interface.
   Reads chapter data and time, paints to the offscreen canvas that
   becomes the CanvasTexture on the LCD_Screen_Plane mesh. */
function drawLCD(ctx, canvas, chap, time){
  const w = canvas.width, h = canvas.height;
  const isApproved = chap && chap.state === 'approved';

  // ---- background gradient (blue idle / green approved) ----
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

  // ---- dot-matrix pixel grid (subtle) ----
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1);
  for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 1, h);

  // ---- top highlight (mimics glass top reflection) ----
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.40);
  top.addColorStop(0, 'rgba(255,255,255,0.14)');
  top.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.40);

  // ---- text lines ----
  const line1 = (chap && chap.lcdLine1) || 'VERIGATE';
  const line2 = (chap && chap.lcdLine2) || 'READY · SCAN';
  const cursorOn = Math.floor(time / 500) % 2 === 0;
  const cursor = cursorOn ? '_' : ' ';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Line 1 — main heading
  ctx.font = '700 90px "JetBrains Mono", "Menlo", "Consolas", monospace';
  ctx.shadowColor = isApproved ? 'rgba(170,255,200,0.9)' : 'rgba(170,210,255,0.9)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = isApproved ? '#E8FFEF' : '#E0EBFF';
  ctx.fillText(line1 + cursor, w / 2, h * 0.36);

  // Line 2 — sub heading
  ctx.font = '600 56px "JetBrains Mono", "Menlo", "Consolas", monospace';
  ctx.shadowBlur = 18;
  ctx.fillStyle = isApproved ? '#C8F5DA' : '#B5CDFF';
  ctx.fillText(line2, w / 2, h * 0.74);

  // ---- animated scan beam ----
  const period = 2800;
  const beamH = 70;
  const beamY = ((time % period) / period) * (h + beamH) - beamH;
  ctx.shadowBlur = 0;
  const beam = ctx.createLinearGradient(0, beamY, 0, beamY + beamH);
  beam.addColorStop(0, 'rgba(255,255,255,0)');
  beam.addColorStop(0.5, isApproved ? 'rgba(180,255,200,0.28)' : 'rgba(180,210,255,0.28)');
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, beamY, w, beamH);

  // ---- subtle inner vignette to give depth ----
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.30, w * 0.5, h * 0.5, w * 0.55);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

window.DeviceWithLCD = DeviceWithLCD;
