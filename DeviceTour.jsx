/* DeviceTour: one 3D VeriGate device for the whole page (23.11.2026).
   ============================================================
   · One fixed, full-screen WebGL canvas sits behind the content.
   · Where it should be comes from Story.jsx (window.__vgTarget, a pure
     function of the scroll position) or, further down, the Contact slot.
     Elsewhere the canvas fades out and stops drawing.
   · The shell is split into a tray and a front panel, and the inside
     (Arduino, RC522 reader, LCD module, 9 V battery, wires) is modelled
     here, so the "Built piece by piece" section can take it apart and put
     it back together as you scroll (window.__vgBuild = 0..1).
   · The power switch is real: a DOM button rides on top of the 3D switch,
     flips the rocker and turns the screen on and off.
   · Renders only while the tab is visible; pixel ratio at most 1.25. */

function tourClamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function tourEase(t){ t = tourClamp(t, 0, 1); return t * t * (3 - 2 * t); }
function tourWin(p, a, b){ return tourEase((p - a) / (b - a)); }

// assembly windows on the build progress (0..1); a part is in place at 1
const TOUR_PARTS = {
  tray:    { win: [0.04, 0.14], off: [0, -0.012, -0.075] },
  mcu:     { win: [0.14, 0.28], off: [-0.006, 0.006, -0.03] },
  rc522:   { win: [0.28, 0.42], off: [0.004, -0.022, 0.035] },
  lcd:     { win: [0.42, 0.56], off: [0, 0.03, 0.06] },
  battery: { win: [0.56, 0.66], off: [0.035, -0.04, 0.012] },
  front:   { win: [0.74, 0.86], off: [0, 0, 0.1] },
};
const TOUR_WIRES_WIN = [0.62, 0.74];
const TOUR_POWER_AT = 0.9;

function DeviceTour(){
  const mountRef = React.useRef(null);
  const btnRef = React.useRef(null);

  React.useEffect(() => {
    let alive = true, raf = 0;
    const off = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); off.push(() => t.removeEventListener(ev, fn, o)); };

    const start = () => {
      const THREE = window.THREE;
      const mount = mountRef.current, btn = btnRef.current;
      if (!THREE || !window.GLTFLoader || !mount || !alive) return;
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

      // ----- renderer, camera (straight on, so pixels map to world simply) -----
      const D = 0.5, FOV = 28;
      const H = 2 * D * Math.tan(FOV * Math.PI / 360);     // world height visible at the device
      let vw = innerWidth, vh = innerHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, vw / vh, 0.01, 5);
      camera.position.set(0, 0, D); camera.lookAt(0, 0, 0);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(vw, vh);
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
      mount.appendChild(renderer.domElement);
      if (window.RoomEnvironment){
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new window.RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
      }

      // ----- studio light: white key, low fill, blue rim, white top rim -----
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      // a soft work light that comes up while the device is apart, so the boards read
      const work = new THREE.HemisphereLight(0xffffff, 0x1a2440, 0); scene.add(work);
      const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(0.55, 0.6, 0.5); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-0.45, 0.2, 0.3); scene.add(fill);
      const rim = new THREE.DirectionalLight(0x2d6bff, 2.4); rim.position.set(-0.3, 0.35, -0.5); scene.add(rim);
      const topL = new THREE.DirectionalLight(0xffffff, 1.5); topL.position.set(0.4, 0.7, -0.6); scene.add(topL);

      // stage = where the device is on screen (position + size); spinner = how it is turned
      const stage = new THREE.Group(); scene.add(stage);
      const spinner = new THREE.Group(); stage.add(spinner);
      const lamp = new THREE.SpotLight(0xffffff, 14, 0, 0.215, 0.18, 0);
      lamp.position.set(0, 0.36, 0.02); lamp.target.position.set(0, -0.05, 0);
      lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048);
      lamp.shadow.camera.near = 0.05; lamp.shadow.camera.far = 1; lamp.shadow.bias = -0.0002; lamp.shadow.normalBias = 0.0004; lamp.shadow.radius = 2.5;
      spinner.add(lamp); spinner.add(lamp.target);
      const fadeCv = document.createElement('canvas'); fadeCv.width = fadeCv.height = 256;
      const fctx = fadeCv.getContext('2d'), fg = fctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      fg.addColorStop(0, '#fff'); fg.addColorStop(.62, '#fff'); fg.addColorStop(.85, '#555'); fg.addColorStop(1, '#000');
      fctx.fillStyle = fg; fctx.fillRect(0, 0, 256, 256);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 1, metalness: 0, envMapIntensity: 0, transparent: true, alphaMap: new THREE.CanvasTexture(fadeCv), depthWrite: false, opacity: 1 });
      const floor = new THREE.Mesh(new THREE.CircleGeometry(0.15, 96), floorMat);
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = -0.05;
      spinner.add(floor);
      // a soft light behind the device, so the black case always stands off the black page

      // ----- LCD canvas texture -----
      const lcdCanvas = document.createElement('canvas'); lcdCanvas.width = 1024; lcdCanvas.height = 220;
      const lcdCtx = lcdCanvas.getContext('2d');
      const lcdTex = new THREE.CanvasTexture(lcdCanvas);
      if (THREE.SRGBColorSpace) lcdTex.colorSpace = THREE.SRGBColorSpace;
      lcdTex.anisotropy = 8; lcdTex.minFilter = THREE.LinearFilter;

      // ----- model + the parts inside it -----
      let model = null, rocker = null, switchAnchor = null, wires = [];
      const parts = {};     // name -> { group, e (current explode 0..1), base: Vector3 }
      const loader = new window.GLTFLoader();
      loader.load('./verigate-device.glb?v=21', (gltf) => {
        if (!alive) return;
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
        const fit = 0.10 / Math.max(sz.x, sz.y, sz.z);
        model.scale.setScalar(fit);
        model.position.copy(c).multiplyScalar(-fit);

        const byName = {};
        model.traverse(o => { if (o.isMesh) byName[o.name] = o; });
        const bodyMat = byName.Verigate_Body.material;
        byName.Verigate_Body.visible = false;      // replaced by a tray + a front panel that can come apart

        const mk = (parent, w, h, d, mat, x, y, z) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
          m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
        };
        const std = (color, rough, metal) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal || 0, envMapIntensity: 0.5 });
        const group = (name) => {
          const g = new THREE.Group(); model.add(g);
          parts[name] = { group: g, e: 0 };
          return g;
        };
        const T = 0.002;   // wall thickness

        // tray: back + four walls, with the power switch on its right wall
        const tray = group('tray');
        mk(tray, 0.090, 0.092, T, bodyMat, 0, 0, -0.0215);
        mk(tray, T, 0.092, 0.043, bodyMat, -0.044, 0, -0.0005);
        mk(tray, T, 0.092, 0.043, bodyMat, 0.044, 0, -0.0005);
        mk(tray, 0.086, T, 0.043, bodyMat, 0, 0.045, -0.0005);
        mk(tray, 0.086, T, 0.043, bodyMat, 0, -0.045, -0.0005);
        // the meshes sit at the model origin with their shape baked in, so moving them
        // into a group placed at the origin keeps them where they are
        tray.add(byName.Verigate_Switch_Frame);
        // the rocker (and its I / O marks) pivots about its own middle
        const rk = byName.Verigate_Switch_Rocker;
        rk.geometry.computeBoundingBox(); rk.updateMatrix();
        const rkC = rk.geometry.boundingBox.clone().applyMatrix4(rk.matrix).getCenter(new THREE.Vector3());
        rocker = new THREE.Group(); rocker.position.copy(rkC); tray.add(rocker);
        [rk, byName.Verigate_Switch_I, byName.Verigate_Switch_O].forEach(m => { rocker.add(m); m.position.sub(rkC); });
        switchAnchor = new THREE.Object3D(); switchAnchor.position.set(0.0485, 0.0212, 0); tray.add(switchAnchor);

        // front panel: the face with the LCD window and the SCAN mark
        const front = group('front');
        mk(front, 0.090, 0.092, T, bodyMat, 0, 0, 0.0215);
        ['Verigate_SCAN_Text', 'Verigate_LCD_Bezel', 'Verigate_LCD_Screen', 'LCD_Screen_Plane'].forEach(n => front.add(byName[n]));
        byName.LCD_Screen_Plane.material = new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false });

        const black = std(0x0b0c0f, 0.55), silver = std(0xb9bec6, 0.3, 0.9), gold = std(0xc9a24a, 0.35, 0.8);
        // Arduino UNO R4 (68.6 × 53.4 mm), facing the front
        const mcu = group('mcu');
        mk(mcu, 0.0686, 0.0534, 0.0016, std(0x0f7f8c, 0.5), -0.004, 0.0, -0.0127);
        mk(mcu, 0.013, 0.013, 0.0016, black, 0.004, -0.004, -0.0111);
        mk(mcu, 0.009, 0.0075, 0.0034, silver, -0.0335, 0.012, -0.0102);
        mk(mcu, 0.010, 0.009, 0.010, black, -0.0335, -0.014, -0.0069);
        mk(mcu, 0.046, 0.0025, 0.0085, black, 0.002, 0.0245, -0.0077);
        mk(mcu, 0.040, 0.0025, 0.0085, black, 0.006, -0.0245, -0.0077);
        mk(mcu, 0.005, 0.005, 0.0016, silver, 0.020, 0.012, -0.0111);

        // RC522 reader, right behind the SCAN mark, with its copper antenna loop
        const rc = group('rc522');
        mk(rc, 0.060, 0.040, 0.0016, std(0x1d4fbf, 0.45), 0, -0.020, 0.0172);
        const cu = std(0xc27a3a, 0.35, 0.85);
        [[0.034, 0.0012, -0.0045, -0.0055], [0.034, 0.0012, -0.0045, -0.0345], [0.0012, 0.03, -0.0215, -0.020], [0.0012, 0.03, 0.0125, -0.020]].forEach(([w, h, x, y]) => mk(rc, w, h, 0.0004, cu, x, y, 0.0182));
        mk(rc, 0.006, 0.006, 0.0012, black, 0.021, -0.016, 0.0186);
        mk(rc, 0.020, 0.0025, 0.0025, black, 0.018, -0.036, 0.0164);

        // LCD 16×2 module behind the window: green board + dark glass block
        const lcd = group('lcd');
        mk(lcd, 0.080, 0.036, 0.0016, std(0x1f7a3e, 0.5), 0, 0.021, 0.0075);
        mk(lcd, 0.071, 0.024, 0.0085, black, 0, 0.0215, 0.0126);
        mk(lcd, 0.040, 0.0025, 0.002, gold, -0.012, 0.0365, 0.0094);

        // 9 V backup battery, lying in the bottom of the tray
        const bat = group('battery');
        mk(bat, 0.0485, 0.0175, 0.0265, std(0x15161a, 0.45), 0.012, -0.0345, -0.006);
        mk(bat, 0.020, 0.0177, 0.0267, gold, 0.022, -0.0345, -0.006);
        mk(bat, 0.003, 0.006, 0.006, silver, 0.0375, -0.0345, -0.010);
        mk(bat, 0.003, 0.006, 0.006, silver, 0.0375, -0.0345, -0.002);

        // wires: drawn along their path when their step comes
        const tube = (pts, color) => {
          const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
          const geo = new THREE.TubeGeometry(curve, 64, 0.0006, 6, false);
          const m = new THREE.Mesh(geo, std(color, 0.5)); m.castShadow = true;
          geo.setDrawRange(0, 0); model.add(m); wires.push(m); return m;
        };
        tube([[-0.012, 0.035, 0.009], [-0.02, 0.031, 0.0], [-0.016, 0.027, -0.004], [-0.01, 0.025, -0.004]], 0xd23b3b);
        tube([[-0.006, 0.035, 0.009], [-0.008, 0.031, 0.001], [-0.002, 0.027, -0.004], [0.002, 0.025, -0.004]], 0x2d6bff);
        tube([[0.018, -0.036, 0.016], [0.016, -0.03, 0.006], [0.012, -0.026, -0.002], [0.010, -0.0245, -0.004]], 0xe8c547);
        tube([[0.0375, -0.034, -0.002], [0.04, -0.02, -0.004], [0.03, -0.0065, -0.004], [-0.027, -0.014, -0.0015]], 0x1a1a1a);
        tube([[0.0375, -0.034, -0.010], [0.042, -0.024, -0.012], [0.02, -0.0005, -0.006], [-0.03, -0.014, -0.002]], 0xd23b3b);

        Object.keys(parts).forEach(k => {
          parts[k].base = parts[k].group.position.clone();
          parts[k].off = new THREE.Vector3().fromArray(TOUR_PARTS[k].off);
        });
        model.traverse(o => { if (o.isMesh && o.material && 'envMapIntensity' in o.material && o.material !== byName.LCD_Screen_Plane.material) o.material.envMapIntensity = 0.85; });
        model.userData.z0 = model.position.z;
        floor.position.y = model.position.y - 0.046 * fit - 0.0003;   // flush with the bottom of the case
        modelAt = performance.now();
        spinner.add(model);
        first = true;
      }, undefined, (err) => console.error('GLB load error:', err));

      // ----- the phoenix: loaded once the visitor scrolls past the hero, then it flies
      // behind the device during one chapter change (Story passes bird = 0..1) -----
      let bird = null, birdMixer = null, birdLoading = false, birdFit = 1, lastScrollAt = 0, modelAt = Infinity;
      let finaleArmed = false, birdStart = -1e9;
      const BIRD_MS = 3600;
      on(window, 'scroll', () => { lastScrollAt = performance.now(); }, { passive: true });
      const loadBird = () => {
        birdLoading = true;
        new window.GLTFLoader().load('./phoenix-bird.glb?v=40', (gltf) => {
          if (!alive) return;
          bird = gltf.scene;
          const bb = new THREE.Box3().setFromObject(bird), bs = bb.getSize(new THREE.Vector3());
          birdFit = 0.085 / Math.max(bs.x, bs.y, bs.z);
          const inner = new THREE.Group(); inner.add(bird);
          bird.position.copy(bb.getCenter(new THREE.Vector3())).multiplyScalar(-1);
          bird = inner; bird.visible = false; scene.add(bird);
          if (gltf.animations && gltf.animations.length){
            birdMixer = new THREE.AnimationMixer(gltf.scene);
            const clip = THREE.AnimationUtils.subclip(gltf.animations[0], 'flap', 96, 192, 24);
            birdMixer.clipAction(clip).play();
          }
          // compile its shaders and upload its textures now, not on its first visible frame
          // (compile skips hidden objects, so show it for that one call)
          const warm = () => {
            try {
              bird.visible = true; bird.scale.setScalar(1e-4); bird.position.set(0, 0, -0.3);
              if (birdMixer) birdMixer.update(0.016);
              renderer.compile(scene, camera); renderer.render(scene, camera);   // one tiny draw uploads the skin too
              bird.visible = false;
              if (renderer.initTexture) gltf.scene.traverse(o => { if (o.isMesh && o.material) Object.values(o.material).forEach(v => { if (v && v.isTexture) renderer.initTexture(v); }); });
            } catch (e) {}
          };
          if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 1500 }); else setTimeout(warm, 300);
        }, undefined, () => {});
      };

      // ----- where the device should be -----
      // The story (Story.jsx) writes window.__vgTarget every frame while it is on
      // screen: a screen position, a size and the device state, computed straight
      // from the scroll position. Below it, the device rides on the Contact slot.
      // Anywhere else it fades out (and stops rendering).
      const contactPose = () => {
        const el = document.querySelector('.contact-slot');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        // arm the phoenix: it flies past once each time the finale comes into view
        const mid = r.top + r.height / 2;
        if (mid > vh * 0.1 && mid < vh * 0.8){ if (!finaleArmed){ finaleArmed = true; birdStart = performance.now() + 250; } }
        else if (r.bottom < 0 || r.top > vh) finaleArmed = false;
        if (r.bottom < 0 || r.top > vh || !r.height) return r.top < vh * 2.5 && r.top > 0 ? { soon: true } : null;
        const d = el.dataset;
        return { key: 'contact', cx: r.left + r.width / 2, cy: r.top + r.height / 2, size: Math.min(r.width * 0.9, r.height),
          yaw: -0.45, pitch: 0.18, spin: 1, floor: 1, lcd1: d.lcd1, lcd2: d.lcd2, state: d.state, power: 1, build: -1, wantBird: true };
      };

      // ----- animated state -----
      const cur = { x: 0, y: 0, s: 0.0001, yaw: -0.55, pitch: 0.2, floor: 1, power: 1, shift: 0, vis: 0 };
      let first = false, spin = 0, lastT = 0, powerOn = true, bootAt = -9999, lastLcd = 0, lcdKey = '';
      let btnShown = null, btnX = -1, btnY = -1, btnLabelOn = null, lastMode = '', userPower = null, lastKey = '', lastTg = null;
      const v3 = new THREE.Vector3(), n3 = new THREE.Vector3();

      window.__vgTour = { toggle: () => { userPower = powerOn ? 0 : 1; } };

      const onResize = () => {
        vw = innerWidth; vh = innerHeight;
        camera.aspect = vw / vh; camera.updateProjectionMatrix();
        renderer.setSize(vw, vh);
      };
      on(window, 'resize', onResize);

      const animate = (t) => {
        if (!alive) return;
        raf = requestAnimationFrame(animate);
        if (document.hidden || !model) return;
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;

        const st = window.__vgTarget;
        let tg = st && st.active ? st : contactPose();
        if (tg && tg.soon){ if (!birdLoading) loadBird(); tg = null; }
        const mode = tg ? (tg === st ? 'story' : 'contact') : 'none';
        // fade in and out; a device that appears from nothing starts where it should be
        cur.vis += ((tg ? 1 : 0) - cur.vis) * (reduce ? 1 : 1 - Math.exp(-dt * 8));
        if (mode !== lastMode){ if (lastMode === 'none' || lastMode === '') first = true; lastMode = mode; }
        mount.style.opacity = cur.vis.toFixed(3);
        if (!tg){
          if (cur.vis < 0.01 || !lastTg){ if (btnShown){ btn.classList.remove('on'); btnShown = false; } return; }
          tg = lastTg;
        }
        lastTg = tg;
        if (tg.key !== lastKey){ lastKey = tg.key; userPower = null; }

        const isBuild = tg.build >= 0;
        const bp = isBuild ? tourClamp(tg.build, 0, 1) : 1;

        // target: screen position and size -> world
        const tx = (tg.cx / vw - 0.5) * H * (vw / vh);
        const ty = -(tg.cy / vh - 0.5) * H;
        let ts = (tg.size / vh) * H / 0.10 * 0.64;
        let tyaw = tg.yaw, tpitch = tg.pitch;
        if (isBuild){
          const apart = vw < 700 ? 0.52 : 0.68;
          ts *= apart + (1 - apart) * tourWin(bp, 0.74, 0.9);
          tyaw -= 0.55 * (1 - tourWin(bp, 0.6, 0.95));     // turned to the side while it is apart
        }
        if (tg.spin && !reduce){ spin += dt; tyaw += Math.sin(spin * 0.45) * 0.42; }    // a slow sway that keeps the screen facing you
        tyaw = tyaw + 2 * Math.PI * Math.round((cur.yaw - tyaw) / (2 * Math.PI));

        // the target already follows the scroll smoothly, so this only takes the edge off
        const k = (first || reduce) ? 1 : 1 - Math.exp(-dt * 10);
        const kr = (first || reduce) ? 1 : 1 - Math.exp(-dt * 6);
        cur.x += (tx - cur.x) * k; cur.y += (ty - cur.y) * k; cur.s += (ts - cur.s) * k;
        cur.yaw += (tyaw - cur.yaw) * kr; cur.pitch += (tpitch - cur.pitch) * kr;
        cur.floor += ((tg.floor || 0) - cur.floor) * kr;

        // explode / assemble: each part follows its own window on the build progress
        let spread = 0;
        Object.keys(parts).forEach(name => {
          const P = parts[name], w = TOUR_PARTS[name].win;
          const te = isBuild ? 1 - tourWin(bp, w[0], w[1]) : 0;
          P.e += (te - P.e) * ((first || reduce) ? 1 : 1 - Math.exp(-dt * 9));
          P.group.position.copy(P.base).addScaledVector(P.off, P.e);
          spread += P.e;
        });
        const wireT = isBuild ? tourWin(bp, TOUR_WIRES_WIN[0], TOUR_WIRES_WIN[1]) : 1;
        wires.forEach(m => m.geometry.setDrawRange(0, Math.floor(m.geometry.index.count * wireT / 3) * 3));
        cur.shift += ((spread / 6) * 0.012 - cur.shift) * k;
        work.intensity = 2.4 * Math.min(1, spread / 3);

        // power: the story decides, the switch overrides until the next chapter
        let wantOn = tg.power !== 0;
        if (isBuild) wantOn = bp >= TOUR_POWER_AT;
        if (userPower !== null) wantOn = !!userPower;
        if (wantOn && !powerOn) bootAt = t;
        powerOn = wantOn;
        cur.power += ((powerOn ? 1 : 0) - cur.power) * (reduce ? 1 : 1 - Math.exp(-dt * 10));
        if (rocker) rocker.rotation.y += ((powerOn ? -0.32 : 0.32) - rocker.rotation.y) * (reduce ? 1 : 1 - Math.exp(-dt * 16));

        stage.position.set(cur.x, cur.y, 0);
        stage.scale.setScalar(cur.s);
        spinner.rotation.set(cur.pitch, cur.yaw, 0);
        spinner.position.y = reduce ? 0 : Math.sin(t * 0.0009) * 0.0025;
        model.position.z = model.userData.z0 - cur.shift;
        floorMat.opacity = cur.floor; floor.visible = cur.floor > 0.02;
        lamp.intensity = 4 + 8 * cur.floor;

        // LCD: off, booting, or the chapter's two lines
        const info = { lcdLine1: tg.lcd1 || 'VERIGATE', lcdLine2: tg.lcd2 || 'READY · SCAN', state: tg.state || 'idle' };
        const key = info.lcdLine1 + info.lcdLine2 + info.state + (cur.power > 0.98 ? 1 : cur.power < 0.02 ? 0 : 'f') + (t - bootAt < 1500 ? 'b' : '');
        if (key !== lcdKey || t - lastLcd > 50){
          drawTourLCD(lcdCtx, lcdCanvas, info, t, cur.power, t - bootAt);
          lcdTex.needsUpdate = true; lastLcd = t; lcdKey = key;
        }

        // the phoenix crosses from right to left, well behind the device
        // load it in a quiet moment (no scrolling for 1.2 s), or at the latest a chapter before it flies
        if (!birdLoading && model && ((t - lastScrollAt > 1200 && t - modelAt > 2500) || tg.wantBird)) loadBird();
        if (bird){
          const fb = tg.key === 'contact' ? (t - birdStart) / BIRD_MS : -1;
          const fly = fb > 0 && fb < 1 && !reduce;
          if (fly !== bird.visible) bird.visible = fly;
          if (fly){
            const zb = -0.32, half = (D - zb) * Math.tan(FOV * Math.PI / 360);
            const span = half * (vw / vh) + 0.12;
            const f = fb * fb * (3 - 2 * fb) * 0.35 + fb * 0.65;        // a little slower at the edges
            const yb = cur.y * (D - zb) / D;                              // level with the device on screen
            bird.position.set(span - 2 * span * f, yb + 0.01 + 0.05 * f + Math.sin(f * Math.PI * 2) * 0.008, zb);
            bird.rotation.set(0.06, Math.PI - 0.25, Math.sin(fb * Math.PI * 3) * 0.08);
            bird.scale.setScalar(birdFit * (vw < 700 ? 0.8 : 1.15));
            if (birdMixer) birdMixer.update(dt);
          }
        }

        renderer.render(scene, camera);
        first = false;

        // the power button rides on the 3D switch while the switch faces the viewer
        if (switchAnchor && btn){
          switchAnchor.getWorldPosition(v3);
          n3.set(1, 0, 0).transformDirection(switchAnchor.matrixWorld);
          const px = (v3.x / (H * vw / vh) + 0.5) * vw, py = (-v3.y / H + 0.5) * vh;
          const devPx = cur.s * 0.10 / H * vh;
          const show = n3.z > 0.25 && cur.vis > 0.9 && devPx > 110 && py > 80 && py < vh - 20 && spread < 0.3;
          if (show !== btnShown){ btn.classList.toggle('on', show); btn.tabIndex = show ? 0 : -1; btnShown = show; }
          if (show && (Math.abs(px - btnX) > 0.3 || Math.abs(py - btnY) > 0.3)){
            btn.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
            btnX = px; btnY = py;
          }
          if (btnLabelOn !== powerOn){
            btn.setAttribute('aria-pressed', powerOn ? 'true' : 'false');
            btn.querySelector('.tour-power-tag').textContent = powerOn ? 'Switch off' : 'Switch on';
            btnLabelOn = powerOn;
          }
        }
      };
      raf = requestAnimationFrame(animate);

      off.push(() => {
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        scene.traverse(o => { if (o.isMesh){ o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose(); } });
        lcdTex.dispose();
        delete window.__vgTour;
      });
    };

    if (window.__threeReady) start(); else on(window, 'threeready', start, { once: true });
    return () => { alive = false; cancelAnimationFrame(raf); off.forEach(f => f()); };
  }, []);

  return (
    <>
      <div ref={mountRef} className="tour-canvas" aria-hidden="true"></div>
      <button ref={btnRef} type="button" className="tour-power" tabIndex={-1} aria-pressed="true"
        aria-label="Power switch of the 3D device" onClick={() => window.__vgTour && window.__vgTour.toggle()}>
        <span className="tour-power-ring" aria-hidden="true"></span>
        <span className="tour-power-tag">Switch off</span>
      </button>
    </>
  );
}

/* drawTourLCD: the LCD with a real power state.
   power 0..1 is the backlight; for 1.4 s after switching on it shows a boot screen. */
function drawTourLCD(ctx, canvas, info, t, power, sinceBoot){
  const w = canvas.width, h = canvas.height;
  if (power < 0.02){
    ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    return;
  }
  if (sinceBoot < 1400){
    window.drawLCD(ctx, canvas, { lcdLine1: 'VERIGATE', lcdLine2: ' ', state: 'idle' }, 0);
    const k = tourClamp((sinceBoot - 300) / 900, 0, 1);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(224,235,255,0.25)'; ctx.fillRect(w * 0.2, h * 0.68, w * 0.6, 22);
    ctx.fillStyle = '#E0EBFF'; ctx.fillRect(w * 0.2, h * 0.68, w * 0.6 * k, 22);
  } else {
    window.drawLCD(ctx, canvas, info, t);
  }
  if (power < 0.99){ ctx.fillStyle = 'rgba(5,7,12,' + (1 - power).toFixed(3) + ')'; ctx.fillRect(0, 0, w, h); }
}

window.DeviceTour = DeviceTour;
