
/* VeriGate — built from src/*.jsx by tools/build-verigate (Babel, preset react). Do not edit by hand. */

/* ---- DeviceWithLCD ---- */
(function(){
function drawLCD(ctx, canvas, chap, time) {
  const w = canvas.width,
    h = canvas.height;
  const isApproved = chap && chap.state === 'approved';
  const isWarn = chap && chap.state === 'warn';
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 50, w * 0.5, h * 0.35, w * 0.7);
  if (isWarn) {
    bg.addColorStop(0.00, '#D8463B');
    bg.addColorStop(0.30, '#B0302A');
    bg.addColorStop(0.65, '#7E1D1B');
    bg.addColorStop(1.00, '#561312');
  } else if (isApproved) {
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
  ctx.font = '700 90px "IBM Plex Mono", "Menlo", "Consolas", monospace';
  ctx.shadowColor = isWarn ? 'rgba(255,190,180,0.9)' : isApproved ? 'rgba(170,255,200,0.9)' : 'rgba(170,210,255,0.9)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = isWarn ? '#FFECE8' : isApproved ? '#E8FFEF' : '#E0EBFF';
  ctx.fillText(line1 + cursor, w / 2, h * 0.36);
  ctx.font = '600 56px "IBM Plex Mono", "Menlo", "Consolas", monospace';
  ctx.shadowBlur = 18;
  ctx.fillStyle = isWarn ? '#FFC9C0' : isApproved ? '#C8F5DA' : '#B5CDFF';
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
window.drawLCD = drawLCD;
})();

/* ---- DeviceTour ---- */
(function(){
function tourClamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function tourEase(t) {
  t = tourClamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}
function tourWin(p, a, b) {
  return tourEase((p - a) / (b - a));
}
const TOUR_PARTS = {
  tray: {
    win: [0.04, 0.14],
    off: [0, -0.012, -0.075]
  },
  mcu: {
    win: [0.14, 0.28],
    off: [-0.006, 0.006, -0.03]
  },
  rc522: {
    win: [0.28, 0.42],
    off: [0.004, -0.022, 0.035]
  },
  lcd: {
    win: [0.42, 0.56],
    off: [0, 0.03, 0.06]
  },
  battery: {
    win: [0.56, 0.66],
    off: [0.035, -0.04, 0.012]
  },
  front: {
    win: [0.74, 0.86],
    off: [0, 0, 0.1]
  }
};
const TOUR_WIRES_WIN = [0.62, 0.74];
const TOUR_POWER_AT = 0.9;
function DeviceTour() {
  const mountRef = React.useRef(null);
  const btnRef = React.useRef(null);
  React.useEffect(() => {
    let alive = true,
      raf = 0;
    const off = [];
    const on = (t, ev, fn, o) => {
      t.addEventListener(ev, fn, o);
      off.push(() => t.removeEventListener(ev, fn, o));
    };
    const start = () => {
      const THREE = window.THREE;
      const mount = mountRef.current,
        btn = btnRef.current;
      if (!THREE || !window.GLTFLoader || !mount || !alive) return;
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const D = 0.5,
        FOV = 28;
      const H = 2 * D * Math.tan(FOV * Math.PI / 360);
      let vw = innerWidth,
        vh = innerHeight;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(FOV, vw / vh, 0.01, 5);
      camera.position.set(0, 0, D);
      camera.lookAt(0, 0, 0);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(vw, vh);
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
      mount.appendChild(renderer.domElement);
      if (window.RoomEnvironment) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new window.RoomEnvironment(), 0.04).texture;
        pmrem.dispose();
      }
      scene.add(new THREE.AmbientLight(0xffffff, 0.22));
      const work = new THREE.HemisphereLight(0xffffff, 0x1a2440, 0);
      scene.add(work);
      const key = new THREE.DirectionalLight(0xffffff, 2.6);
      key.position.set(0.55, 0.6, 0.5);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35);
      fill.position.set(-0.45, 0.2, 0.3);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0x2d6bff, 2.4);
      rim.position.set(-0.3, 0.35, -0.5);
      scene.add(rim);
      const topL = new THREE.DirectionalLight(0xffffff, 1.5);
      topL.position.set(0.4, 0.7, -0.6);
      scene.add(topL);
      const stage = new THREE.Group();
      scene.add(stage);
      const spinner = new THREE.Group();
      stage.add(spinner);
      const lamp = new THREE.SpotLight(0xffffff, 14, 0, 0.215, 0.18, 0);
      lamp.position.set(0, 0.36, 0.02);
      lamp.target.position.set(0, -0.05, 0);
      lamp.castShadow = true;
      lamp.shadow.mapSize.set(2048, 2048);
      lamp.shadow.camera.near = 0.05;
      lamp.shadow.camera.far = 1;
      lamp.shadow.bias = -0.0002;
      lamp.shadow.normalBias = 0.0004;
      lamp.shadow.radius = 2.5;
      spinner.add(lamp);
      spinner.add(lamp.target);
      const fadeCv = document.createElement('canvas');
      fadeCv.width = fadeCv.height = 256;
      const fctx = fadeCv.getContext('2d'),
        fg = fctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      fg.addColorStop(0, '#fff');
      fg.addColorStop(.62, '#fff');
      fg.addColorStop(.85, '#555');
      fg.addColorStop(1, '#000');
      fctx.fillStyle = fg;
      fctx.fillRect(0, 0, 256, 256);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x262626,
        roughness: 1,
        metalness: 0,
        envMapIntensity: 0,
        transparent: true,
        alphaMap: new THREE.CanvasTexture(fadeCv),
        depthWrite: false,
        opacity: 1
      });
      const floor = new THREE.Mesh(new THREE.CircleGeometry(0.15, 96), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      floor.position.y = -0.05;
      spinner.add(floor);
      const lcdCanvas = document.createElement('canvas');
      lcdCanvas.width = 1024;
      lcdCanvas.height = 220;
      const lcdCtx = lcdCanvas.getContext('2d');
      const lcdTex = new THREE.CanvasTexture(lcdCanvas);
      if (THREE.SRGBColorSpace) lcdTex.colorSpace = THREE.SRGBColorSpace;
      lcdTex.anisotropy = 8;
      lcdTex.minFilter = THREE.LinearFilter;
      let model = null,
        rocker = null,
        switchAnchor = null,
        wires = [];
      const parts = {};
      const loader = new window.GLTFLoader();
      loader.load('./verigate-device.glb?v=21', gltf => {
        if (!alive) return;
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const c = box.getCenter(new THREE.Vector3()),
          sz = box.getSize(new THREE.Vector3());
        const fit = 0.10 / Math.max(sz.x, sz.y, sz.z);
        model.scale.setScalar(fit);
        model.position.copy(c).multiplyScalar(-fit);
        const byName = {};
        model.traverse(o => {
          if (o.isMesh) byName[o.name] = o;
        });
        const bodyMat = byName.Verigate_Body.material;
        byName.Verigate_Body.visible = false;
        const mk = (parent, w, h, d, mat, x, y, z) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
          m.position.set(x, y, z);
          m.castShadow = true;
          parent.add(m);
          return m;
        };
        const std = (color, rough, metal) => new THREE.MeshStandardMaterial({
          color,
          roughness: rough,
          metalness: metal || 0,
          envMapIntensity: 0.5
        });
        const group = name => {
          const g = new THREE.Group();
          model.add(g);
          parts[name] = {
            group: g,
            e: 0
          };
          return g;
        };
        const T = 0.002;
        const tray = group('tray');
        mk(tray, 0.090, 0.092, T, bodyMat, 0, 0, -0.0215);
        mk(tray, T, 0.092, 0.043, bodyMat, -0.044, 0, -0.0005);
        mk(tray, T, 0.092, 0.043, bodyMat, 0.044, 0, -0.0005);
        mk(tray, 0.086, T, 0.043, bodyMat, 0, 0.045, -0.0005);
        mk(tray, 0.086, T, 0.043, bodyMat, 0, -0.045, -0.0005);
        tray.add(byName.Verigate_Switch_Frame);
        const rk = byName.Verigate_Switch_Rocker;
        rk.geometry.computeBoundingBox();
        rk.updateMatrix();
        const rkC = rk.geometry.boundingBox.clone().applyMatrix4(rk.matrix).getCenter(new THREE.Vector3());
        rocker = new THREE.Group();
        rocker.position.copy(rkC);
        tray.add(rocker);
        [rk, byName.Verigate_Switch_I, byName.Verigate_Switch_O].forEach(m => {
          rocker.add(m);
          m.position.sub(rkC);
        });
        switchAnchor = new THREE.Object3D();
        switchAnchor.position.set(0.0485, 0.0212, 0);
        tray.add(switchAnchor);
        const front = group('front');
        mk(front, 0.090, 0.092, T, bodyMat, 0, 0, 0.0215);
        ['Verigate_SCAN_Text', 'Verigate_LCD_Bezel', 'Verigate_LCD_Screen', 'LCD_Screen_Plane'].forEach(n => front.add(byName[n]));
        byName.LCD_Screen_Plane.material = new THREE.MeshBasicMaterial({
          map: lcdTex,
          toneMapped: false
        });
        const black = std(0x0b0c0f, 0.55),
          silver = std(0xb9bec6, 0.3, 0.9),
          gold = std(0xc9a24a, 0.35, 0.8);
        const mcu = group('mcu');
        mk(mcu, 0.0686, 0.0534, 0.0016, std(0x0f7f8c, 0.5), -0.004, 0.0, -0.0127);
        mk(mcu, 0.013, 0.013, 0.0016, black, 0.004, -0.004, -0.0111);
        mk(mcu, 0.009, 0.0075, 0.0034, silver, -0.0335, 0.012, -0.0102);
        mk(mcu, 0.010, 0.009, 0.010, black, -0.0335, -0.014, -0.0069);
        mk(mcu, 0.046, 0.0025, 0.0085, black, 0.002, 0.0245, -0.0077);
        mk(mcu, 0.040, 0.0025, 0.0085, black, 0.006, -0.0245, -0.0077);
        mk(mcu, 0.005, 0.005, 0.0016, silver, 0.020, 0.012, -0.0111);
        const rc = group('rc522');
        mk(rc, 0.060, 0.040, 0.0016, std(0x1d4fbf, 0.45), 0, -0.020, 0.0172);
        const cu = std(0xc27a3a, 0.35, 0.85);
        [[0.034, 0.0012, -0.0045, -0.0055], [0.034, 0.0012, -0.0045, -0.0345], [0.0012, 0.03, -0.0215, -0.020], [0.0012, 0.03, 0.0125, -0.020]].forEach(([w, h, x, y]) => mk(rc, w, h, 0.0004, cu, x, y, 0.0182));
        mk(rc, 0.006, 0.006, 0.0012, black, 0.021, -0.016, 0.0186);
        mk(rc, 0.020, 0.0025, 0.0025, black, 0.018, -0.036, 0.0164);
        const lcd = group('lcd');
        mk(lcd, 0.080, 0.036, 0.0016, std(0x1f7a3e, 0.5), 0, 0.021, 0.0075);
        mk(lcd, 0.071, 0.024, 0.0085, black, 0, 0.0215, 0.0126);
        mk(lcd, 0.040, 0.0025, 0.002, gold, -0.012, 0.0365, 0.0094);
        const bat = group('battery');
        mk(bat, 0.0485, 0.0175, 0.0265, std(0x15161a, 0.45), 0.012, -0.0345, -0.006);
        mk(bat, 0.020, 0.0177, 0.0267, gold, 0.022, -0.0345, -0.006);
        mk(bat, 0.003, 0.006, 0.006, silver, 0.0375, -0.0345, -0.010);
        mk(bat, 0.003, 0.006, 0.006, silver, 0.0375, -0.0345, -0.002);
        const tube = (pts, color) => {
          const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
          const geo = new THREE.TubeGeometry(curve, 64, 0.0006, 6, false);
          const m = new THREE.Mesh(geo, std(color, 0.5));
          m.castShadow = true;
          geo.setDrawRange(0, 0);
          model.add(m);
          wires.push(m);
          return m;
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
        model.traverse(o => {
          if (o.isMesh && o.material && 'envMapIntensity' in o.material && o.material !== byName.LCD_Screen_Plane.material) o.material.envMapIntensity = 0.85;
        });
        model.userData.z0 = model.position.z;
        floor.position.y = model.position.y - 0.046 * fit - 0.0003;
        modelAt = performance.now();
        spinner.add(model);
        first = true;
      }, undefined, err => console.error('GLB load error:', err));
      let bird = null,
        birdMixer = null,
        birdLoading = false,
        birdFit = 1,
        lastScrollAt = 0,
        modelAt = Infinity;
      let finaleArmed = false,
        birdStart = -1e9;
      const BIRD_MS = 3600;
      on(window, 'scroll', () => {
        lastScrollAt = performance.now();
      }, {
        passive: true
      });
      const loadBird = () => {
        birdLoading = true;
        new window.GLTFLoader().load('./phoenix-bird.glb?v=40', gltf => {
          if (!alive) return;
          bird = gltf.scene;
          const bb = new THREE.Box3().setFromObject(bird),
            bs = bb.getSize(new THREE.Vector3());
          birdFit = 0.085 / Math.max(bs.x, bs.y, bs.z);
          const inner = new THREE.Group();
          inner.add(bird);
          bird.position.copy(bb.getCenter(new THREE.Vector3())).multiplyScalar(-1);
          bird = inner;
          bird.visible = false;
          scene.add(bird);
          if (gltf.animations && gltf.animations.length) {
            birdMixer = new THREE.AnimationMixer(gltf.scene);
            const clip = THREE.AnimationUtils.subclip(gltf.animations[0], 'flap', 96, 192, 24);
            birdMixer.clipAction(clip).play();
          }
          const warm = () => {
            try {
              bird.visible = true;
              bird.scale.setScalar(1e-4);
              bird.position.set(0, 0, -0.3);
              if (birdMixer) birdMixer.update(0.016);
              renderer.compile(scene, camera);
              renderer.render(scene, camera);
              bird.visible = false;
              if (renderer.initTexture) gltf.scene.traverse(o => {
                if (o.isMesh && o.material) Object.values(o.material).forEach(v => {
                  if (v && v.isTexture) renderer.initTexture(v);
                });
              });
            } catch (e) {}
          };
          if (window.requestIdleCallback) requestIdleCallback(warm, {
            timeout: 1500
          });else setTimeout(warm, 300);
        }, undefined, () => {});
      };
      const contactPose = () => {
        const el = document.querySelector('.contact-slot');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        if (mid > vh * 0.1 && mid < vh * 0.8) {
          if (!finaleArmed) {
            finaleArmed = true;
            birdStart = performance.now() + 250;
          }
        } else if (r.bottom < 0 || r.top > vh) finaleArmed = false;
        if (r.bottom < 0 || r.top > vh || !r.height) return r.top < vh * 2.5 && r.top > 0 ? {
          soon: true
        } : null;
        const d = el.dataset;
        return {
          key: 'contact',
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          size: Math.min(r.width * 0.9, r.height),
          yaw: -0.45,
          pitch: 0.18,
          spin: 1,
          floor: 1,
          lcd1: d.lcd1,
          lcd2: d.lcd2,
          state: d.state,
          power: 1,
          build: -1,
          wantBird: true
        };
      };
      const cur = {
        x: 0,
        y: 0,
        s: 0.0001,
        yaw: -0.55,
        pitch: 0.2,
        floor: 1,
        power: 1,
        shift: 0,
        vis: 0
      };
      let first = false,
        spin = 0,
        lastT = 0,
        powerOn = true,
        bootAt = -9999,
        lastLcd = 0,
        lcdKey = '';
      let btnShown = null,
        btnX = -1,
        btnY = -1,
        btnLabelOn = null,
        lastMode = '',
        userPower = null,
        lastKey = '',
        lastTg = null;
      const v3 = new THREE.Vector3(),
        n3 = new THREE.Vector3();
      window.__vgTour = {
        toggle: () => {
          userPower = powerOn ? 0 : 1;
        }
      };
      const onResize = () => {
        vw = innerWidth;
        vh = innerHeight;
        camera.aspect = vw / vh;
        camera.updateProjectionMatrix();
        renderer.setSize(vw, vh);
      };
      on(window, 'resize', onResize);
      const animate = t => {
        if (!alive) return;
        raf = requestAnimationFrame(animate);
        if (document.hidden || !model) return;
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
        lastT = t;
        const st = window.__vgTarget;
        let tg = st && st.active ? st : contactPose();
        if (tg && tg.soon) {
          if (!birdLoading) loadBird();
          tg = null;
        }
        const mode = tg ? tg === st ? 'story' : 'contact' : 'none';
        cur.vis += ((tg ? 1 : 0) - cur.vis) * (reduce ? 1 : 1 - Math.exp(-dt * 8));
        if (mode !== lastMode) {
          if (lastMode === 'none' || lastMode === '') first = true;
          lastMode = mode;
        }
        mount.style.opacity = cur.vis.toFixed(3);
        if (!tg) {
          if (cur.vis < 0.01 || !lastTg) {
            if (btnShown) {
              btn.classList.remove('on');
              btnShown = false;
            }
            return;
          }
          tg = lastTg;
        }
        lastTg = tg;
        if (tg.key !== lastKey) {
          lastKey = tg.key;
          userPower = null;
        }
        const isBuild = tg.build >= 0;
        const bp = isBuild ? tourClamp(tg.build, 0, 1) : 1;
        const tx = (tg.cx / vw - 0.5) * H * (vw / vh);
        const ty = -(tg.cy / vh - 0.5) * H;
        let ts = tg.size / vh * H / 0.10 * 0.64;
        let tyaw = tg.yaw,
          tpitch = tg.pitch;
        if (isBuild) {
          const apart = vw < 700 ? 0.52 : 0.68;
          ts *= apart + (1 - apart) * tourWin(bp, 0.74, 0.9);
          tyaw -= 0.55 * (1 - tourWin(bp, 0.6, 0.95));
        }
        if (tg.spin && !reduce) {
          spin += dt;
          tyaw += Math.sin(spin * 0.45) * 0.42;
        }
        tyaw = tyaw + 2 * Math.PI * Math.round((cur.yaw - tyaw) / (2 * Math.PI));
        const k = first || reduce ? 1 : 1 - Math.exp(-dt * 10);
        const kr = first || reduce ? 1 : 1 - Math.exp(-dt * 6);
        cur.x += (tx - cur.x) * k;
        cur.y += (ty - cur.y) * k;
        cur.s += (ts - cur.s) * k;
        cur.yaw += (tyaw - cur.yaw) * kr;
        cur.pitch += (tpitch - cur.pitch) * kr;
        cur.floor += ((tg.floor || 0) - cur.floor) * kr;
        let spread = 0;
        Object.keys(parts).forEach(name => {
          const P = parts[name],
            w = TOUR_PARTS[name].win;
          const te = isBuild ? 1 - tourWin(bp, w[0], w[1]) : 0;
          P.e += (te - P.e) * (first || reduce ? 1 : 1 - Math.exp(-dt * 9));
          P.group.position.copy(P.base).addScaledVector(P.off, P.e);
          spread += P.e;
        });
        const wireT = isBuild ? tourWin(bp, TOUR_WIRES_WIN[0], TOUR_WIRES_WIN[1]) : 1;
        wires.forEach(m => m.geometry.setDrawRange(0, Math.floor(m.geometry.index.count * wireT / 3) * 3));
        cur.shift += (spread / 6 * 0.012 - cur.shift) * k;
        work.intensity = 2.4 * Math.min(1, spread / 3);
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
        floorMat.opacity = cur.floor;
        floor.visible = cur.floor > 0.02;
        lamp.intensity = 4 + 8 * cur.floor;
        const info = {
          lcdLine1: tg.lcd1 || 'VERIGATE',
          lcdLine2: tg.lcd2 || 'READY · SCAN',
          state: tg.state || 'idle'
        };
        const key = info.lcdLine1 + info.lcdLine2 + info.state + (cur.power > 0.98 ? 1 : cur.power < 0.02 ? 0 : 'f') + (t - bootAt < 1500 ? 'b' : '');
        if (key !== lcdKey || t - lastLcd > 50) {
          drawTourLCD(lcdCtx, lcdCanvas, info, t, cur.power, t - bootAt);
          lcdTex.needsUpdate = true;
          lastLcd = t;
          lcdKey = key;
        }
        if (!birdLoading && model && (t - lastScrollAt > 1200 && t - modelAt > 2500 || tg.wantBird)) loadBird();
        if (bird) {
          const fb = tg.key === 'contact' ? (t - birdStart) / BIRD_MS : -1;
          const fly = fb > 0 && fb < 1 && !reduce;
          if (fly !== bird.visible) bird.visible = fly;
          if (fly) {
            const zb = -0.32,
              half = (D - zb) * Math.tan(FOV * Math.PI / 360);
            const span = half * (vw / vh) + 0.12;
            const f = fb * fb * (3 - 2 * fb) * 0.35 + fb * 0.65;
            const yb = cur.y * (D - zb) / D;
            bird.position.set(span - 2 * span * f, yb + 0.01 + 0.05 * f + Math.sin(f * Math.PI * 2) * 0.008, zb);
            bird.rotation.set(0.06, Math.PI - 0.25, Math.sin(fb * Math.PI * 3) * 0.08);
            bird.scale.setScalar(birdFit * (vw < 700 ? 0.8 : 1.15));
            if (birdMixer) birdMixer.update(dt);
          }
        }
        renderer.render(scene, camera);
        first = false;
        if (switchAnchor && btn) {
          switchAnchor.getWorldPosition(v3);
          n3.set(1, 0, 0).transformDirection(switchAnchor.matrixWorld);
          const px = (v3.x / (H * vw / vh) + 0.5) * vw,
            py = (-v3.y / H + 0.5) * vh;
          const devPx = cur.s * 0.10 / H * vh;
          const show = n3.z > 0.25 && cur.vis > 0.9 && devPx > 110 && py > 80 && py < vh - 20 && spread < 0.3;
          if (show !== btnShown) {
            btn.classList.toggle('on', show);
            btn.tabIndex = show ? 0 : -1;
            btnShown = show;
          }
          if (show && (Math.abs(px - btnX) > 0.3 || Math.abs(py - btnY) > 0.3)) {
            btn.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
            btnX = px;
            btnY = py;
          }
          if (btnLabelOn !== powerOn) {
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
        scene.traverse(o => {
          if (o.isMesh) {
            o.geometry && o.geometry.dispose();
            o.material && o.material.dispose && o.material.dispose();
          }
        });
        lcdTex.dispose();
        delete window.__vgTour;
      });
    };
    if (window.__threeReady) start();else on(window, 'threeready', start, {
      once: true
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      off.forEach(f => f());
    };
  }, []);
  return React.createElement(React.Fragment, null, React.createElement("div", {
    ref: mountRef,
    className: "tour-canvas",
    "aria-hidden": "true"
  }), React.createElement("button", {
    ref: btnRef,
    type: "button",
    className: "tour-power",
    tabIndex: -1,
    "aria-pressed": "true",
    "aria-label": "Power switch of the 3D device",
    onClick: () => window.__vgTour && window.__vgTour.toggle()
  }, React.createElement("span", {
    className: "tour-power-ring",
    "aria-hidden": "true"
  }), React.createElement("span", {
    className: "tour-power-tag"
  }, "Switch off")));
}
function drawTourLCD(ctx, canvas, info, t, power, sinceBoot) {
  const w = canvas.width,
    h = canvas.height;
  if (power < 0.02) {
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (sinceBoot < 1400) {
    window.drawLCD(ctx, canvas, {
      lcdLine1: 'VERIGATE',
      lcdLine2: ' ',
      state: 'idle'
    }, 0);
    const k = tourClamp((sinceBoot - 300) / 900, 0, 1);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(224,235,255,0.25)';
    ctx.fillRect(w * 0.2, h * 0.68, w * 0.6, 22);
    ctx.fillStyle = '#E0EBFF';
    ctx.fillRect(w * 0.2, h * 0.68, w * 0.6 * k, 22);
  } else {
    window.drawLCD(ctx, canvas, info, t);
  }
  if (power < 0.99) {
    ctx.fillStyle = 'rgba(5,7,12,' + (1 - power).toFixed(3) + ')';
    ctx.fillRect(0, 0, w, h);
  }
}
window.DeviceTour = DeviceTour;
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
  label: 'Inside',
  href: '#build'
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
        @media (hover:hover) and (pointer:fine){.brand:hover .brand-mark{
          transform: rotate(-4deg) scale(1.05);
          filter:
            drop-shadow(0 0 10px rgba(240,179,117,.45))
            drop-shadow(0 2px 10px rgba(124,138,255,.30));
        }}
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
        @media (hover:hover) and (pointer:fine){.nav-links a:hover{ color: var(--text); background: rgba(255,255,255,.05); }}
        @media (hover:hover) and (pointer:fine){.nav-links a:hover::after{
          transform: translateX(-50%) scaleX(1);
          box-shadow: 0 0 10px rgba(124,138,255,.55);
        }}
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
        @media (hover:hover) and (pointer:fine){.nav-cta:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 48px rgba(124,138,255,.55), inset 0 1px 0 rgba(255,255,255,.5);
        }}
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

/* ---- Story ---- */
(function(){
const STORY = [{
  id: 'product',
  len: 0.6,
  dev: 'r',
  yaw: -0.5,
  pitch: 0.2,
  size: 0.7,
  spin: 1,
  floor: 1,
  cy: 0.53
}, {
  id: 'build',
  len: 1.5,
  dev: 'r',
  yaw: -0.5,
  pitch: 0.2,
  size: 0.6,
  build: 1
}, {
  id: 'problem',
  len: 0.62,
  dev: 'l',
  yaw: 0.75,
  pitch: 0.22,
  size: 0.52,
  lcd1: 'NO RECORD',
  lcd2: 'PAPER ONLY',
  state: 'warn'
}, {
  id: 'how',
  len: 0.95,
  dev: 'r',
  yaw: -0.7,
  pitch: 0.2,
  size: 0.56
}, {
  id: 'gate',
  len: 0.62,
  dev: 'l',
  yaw: 0.8,
  pitch: 0.22,
  size: 0.52,
  lcd1: 'TAP CARD',
  lcd2: 'UNDER 200 MS'
}];
const STORY_RUN = STORY.reduce((a, c) => a + c.len, 0);
const BUILD_STEPS = [{
  at: 0,
  t: 'The shell',
  s: 'A matte-black case with the switch on its side.'
}, {
  at: 0.14,
  t: 'Arduino UNO R4',
  s: 'The brain of the device.'
}, {
  at: 0.28,
  t: 'RC522 reader',
  s: 'Right behind the SCAN mark.'
}, {
  at: 0.42,
  t: 'LCD 16×2',
  s: 'Two lines of status.'
}, {
  at: 0.56,
  t: 'Power and wires',
  s: 'A 9 V backup battery and the wiring.'
}, {
  at: 0.74,
  t: 'The SCAN panel',
  s: 'The face closes over everything.'
}, {
  at: 0.88,
  t: 'Switch it on',
  s: 'Try the switch yourself.'
}];
const HOW_STEPS = [{
  t: 'The driver taps a card.',
  lcd1: 'WAITING',
  lcd2: 'TAP CARD'
}, {
  t: 'The shipment shows on the screen.',
  lcd1: 'MATCH FOUND',
  lcd2: 'APPROVE?'
}, {
  t: 'The worker approves it.',
  lcd1: 'APPROVED',
  lcd2: 'WELCOME',
  state: 'approved'
}];
function storyEase(t) {
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return t * t * (3 - 2 * t);
}
function Story() {
  const ref = React.useRef(null);
  const panels = React.useRef([]);
  const [buildStep, setBuildStep] = React.useState(0);
  const [howStep, setHowStep] = React.useState(0);
  React.useEffect(() => {
    let raf = 0,
      alive = true,
      lastB = -1,
      lastH = -1;
    const starts = [];
    STORY.reduce((a, c, i) => {
      starts[i] = a;
      return a + c.len;
    }, 0);
    const tuck = () => {
      const el = ref.current;
      if (!el) return;
      el.style.marginTop = '0px';
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > 0 && top < 200) el.style.marginTop = -top + 'px';
    };
    tuck();
    window.addEventListener('resize', tuck);
    const frame = () => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const el = ref.current;
      if (!el) return;
      const vw = innerWidth,
        vh = innerHeight;
      const r = el.getBoundingClientRect();
      const U = r.height / (STORY_RUN + 1);
      const pos = -r.top / U;
      const wide = vw >= 900;
      const placeOf = c => wide ? {
        cx: (c.dev === 'r' ? 0.7 : 0.3) * vw,
        cy: (c.cy || 0.52) * U,
        size: Math.min(c.size * U, 0.44 * vw)
      } : {
        cx: 0.5 * vw,
        cy: 0.3 * U,
        size: Math.min(c.size * 0.64 * U, 0.9 * vw)
      };
      let i = 0;
      for (let k = 0; k < STORY.length; k++) if (pos >= starts[k]) i = k;
      const c = STORY[i],
        u = pos - starts[i];
      let A = placeOf(c),
        cfg = c,
        B = null,
        m = 0;
      const G = 0.2;
      if (u > c.len - G && i < STORY.length - 1) {
        B = STORY[i + 1];
        m = storyEase((u - (c.len - G)) / (2 * G));
      } else if (u < G && i > 0) {
        B = STORY[i - 1];
        m = storyEase((G - u) / (2 * G));
      }
      let P = A,
        yaw = c.yaw,
        pitch = c.pitch;
      if (B) {
        const Bp = placeOf(B);
        P = {
          cx: A.cx + (Bp.cx - A.cx) * m,
          cy: A.cy + (Bp.cy - A.cy) * m,
          size: A.size + (Bp.size - A.size) * m
        };
        yaw = c.yaw + (B.yaw - c.yaw) * m;
        pitch = c.pitch + (B.pitch - c.pitch) * m;
        if (m > 0.5) cfg = B;
      }
      const over = Math.max(0, pos - STORY_RUN) * U;
      const bi = STORY.findIndex(s => s.build);
      const bp = Math.max(0, Math.min(1, (pos - starts[bi] - 0.12) / (STORY[bi].len - 0.36)));
      const hi = STORY.findIndex(s => s.id === 'how');
      const hp = Math.max(0, Math.min(0.999, (pos - starts[hi] - 0.2) / (STORY[hi].len - 0.4)));
      const hs = Math.floor(hp * HOW_STEPS.length);
      let b = 0;
      BUILD_STEPS.forEach((s, k) => {
        if (bp >= s.at) b = k;
      });
      if (b !== lastB) {
        lastB = b;
        setBuildStep(b);
      }
      if (hs !== lastH) {
        lastH = hs;
        setHowStep(hs);
      }
      const how = cfg.id === 'how' ? HOW_STEPS[hs] : null;
      window.__vgTarget = {
        active: r.bottom > 0 && r.top < vh,
        key: cfg.id,
        cx: P.cx,
        cy: P.cy - over + Math.max(0, r.top),
        size: P.size,
        yaw,
        pitch,
        spin: cfg.spin || 0,
        floor: cfg.floor || 0,
        build: cfg.build ? bp : -1,
        lcd1: how ? how.lcd1 : cfg.lcd1,
        lcd2: how ? how.lcd2 : cfg.lcd2,
        state: how ? how.state || 'idle' : cfg.state,
        power: 1,
        wantBird: pos > 2.5
      };
      STORY.forEach((s, k) => {
        const p = panels.current[k];
        if (!p) return;
        const lu = pos - starts[k];
        const vin = k === 0 ? 1 : storyEase((lu - 0.06) / 0.16);
        const vout = k === STORY.length - 1 ? 1 : 1 - storyEase((lu - (s.len - 0.24)) / 0.16);
        const v = Math.min(vin, vout);
        const y = (1 - vin) * 36 - (1 - vout) * 36;
        const o = v.toFixed(3);
        if (p.__o !== o) {
          p.__o = o;
          p.style.opacity = o;
          p.style.visibility = v > 0.001 ? 'visible' : 'hidden';
        }
        p.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', tuck);
      window.__vgTarget = null;
    };
  }, []);
  const P = i => el => {
    panels.current[i] = el;
  };
  const side = c => 'st-panel ' + (c.dev === 'r' ? 'at-l' : 'at-r');
  let acc = 0;
  const anchors = STORY.map(c => {
    const top = acc;
    acc += c.len;
    return {
      id: c.id === 'product' ? null : c.id,
      top: top + (c.id === 'product' ? 0 : 0.45)
    };
  });
  return React.createElement("section", {
    ref: ref,
    className: "story",
    id: "product",
    style: {
      '--run': STORY_RUN + 1
    },
    "aria-label": "VeriGate"
  }, anchors.filter(a => a.id).map(a => React.createElement("span", {
    key: a.id,
    id: a.id,
    className: "st-anchor",
    style: {
      top: 'calc(' + a.top + ' * var(--unit))'
    }
  })), React.createElement("div", {
    className: "story-sticky"
  }, React.createElement("div", {
    className: side(STORY[0]) + ' st-hero',
    ref: P(0)
  }, React.createElement("h1", {
    className: "st-h1"
  }, "A receiving device,", React.createElement("br", null), React.createElement("em", null, "verified instantly.")), React.createElement("p", {
    className: "st-lede"
  }, "The driver taps a card. The shipment shows on the screen. The worker approves it."), React.createElement("div", {
    className: "st-cta"
  }, React.createElement("a", {
    href: "https://www.linkedin.com/in/osamasunaallah/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn primary big"
  }, "Connect on LinkedIn"), React.createElement("a", {
    href: "#process",
    className: "btn ghost big"
  }, "See it work"))), React.createElement("div", {
    className: side(STORY[1]),
    ref: P(1)
  }, React.createElement("h2", {
    className: "st-h2"
  }, "Built ", React.createElement("em", null, "piece by piece"), "."), React.createElement("div", {
    className: "st-build",
    "aria-live": "polite"
  }, React.createElement("span", {
    className: "st-count"
  }, buildStep + 1, " / ", BUILD_STEPS.length), React.createElement("b", null, BUILD_STEPS[buildStep].t), React.createElement("span", null, BUILD_STEPS[buildStep].s)), React.createElement("span", {
    className: "st-bar",
    "aria-hidden": "true"
  }, React.createElement("i", {
    style: {
      transform: 'scaleX(' + (buildStep + 1) / BUILD_STEPS.length + ')'
    }
  }))), React.createElement("div", {
    className: side(STORY[2]),
    ref: P(2)
  }, React.createElement("h2", {
    className: "st-h2"
  }, "Receiving runs on ", React.createElement("em", null, "faith"), "."), React.createElement("ul", {
    className: "st-list"
  }, React.createElement("li", null, "Paper at the gate."), React.createElement("li", null, "Data typed twice."), React.createElement("li", null, "No single source of truth."))), React.createElement("div", {
    className: side(STORY[3]),
    ref: P(3)
  }, React.createElement("h2", {
    className: "st-h2"
  }, "One tap ", React.createElement("em", null, "closes the loop"), "."), React.createElement("ol", {
    className: "st-steps"
  }, HOW_STEPS.map((s, k) => React.createElement("li", {
    key: k,
    className: k === howStep ? 'on' : ''
  }, React.createElement("span", null, k + 1), s.t)))), React.createElement("div", {
    className: side(STORY[4]),
    ref: P(4)
  }, React.createElement("h2", {
    className: "st-h2"
  }, "Built for the gate, ", React.createElement("em", null, "not the office"), "."), React.createElement("dl", {
    className: "st-stats"
  }, React.createElement("div", null, React.createElement("dt", null, "< 200 ms"), React.createElement("dd", null, "from tap to screen")), React.createElement("div", null, React.createElement("dt", null, "13.56 MHz"), React.createElement("dd", null, "RFID reader")), React.createElement("div", null, React.createElement("dt", null, "1 tap"), React.createElement("dd", null, "per shipment"))))));
}
window.Story = Story;
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
        x.font = '700 104px "IBM Plex Mono", Consolas, monospace';
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
          x.font = '700 26px "IBM Plex Mono", monospace';
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
        x.font = '700 26px "Switzer", Arial';
        x.textBaseline = 'middle';
        x.fillText('VERIGATE · Receiving', 28, 33);
        x.fillStyle = '#6fe3ff';
        x.font = '600 20px "IBM Plex Mono", monospace';
        x.textAlign = 'right';
        x.fillText('PO-4471 · DRV-0417', w - 28, 33);
        x.textAlign = 'left';
        const row = (y, k, v, col = '#e6ecff') => {
          x.fillStyle = '#7480a6';
          x.font = '500 24px "Switzer", Arial';
          x.fillText(k, 40, y);
          x.fillStyle = col;
          x.font = '700 30px "IBM Plex Mono", monospace';
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
          x.font = '800 56px "Switzer", Arial';
          x.textAlign = 'center';
          x.fillText('✓  QTY MATCH', w / 2, 425);
          x.font = '700 30px "IBM Plex Mono", monospace';
          x.fillStyle = '#c6f7dc';
          x.fillText('APPROVED · SHIPMENT RECORDED', w / 2, 482);
          x.textAlign = 'left';
        } else {
          x.fillStyle = '#16204a';
          x.beginPath();
          x.roundRect(40, 368, w - 80, 150, 22);
          x.fill();
          x.fillStyle = '#8aa5ff';
          x.font = '700 40px "Switzer", Arial';
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
        x.font = '700 26px Switzer, Arial';
        x.fillText('VERIGATE · Receiving', 28, 33);
        x.fillStyle = '#6fe3ff';
        x.font = '600 20px "IBM Plex Mono", monospace';
        x.textAlign = 'right';
        x.fillText('PO-4471 · DRV-0417', w - 28, 33);
        x.textAlign = 'left';
        const row = (y, k, v, col) => {
          x.fillStyle = '#7480a6';
          x.font = '500 24px Switzer, Arial';
          x.fillText(k, 40, y);
          x.fillStyle = col || '#e6ecff';
          x.font = '700 30px "IBM Plex Mono", monospace';
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
          x.font = '800 54px Switzer, Arial';
          x.fillText('QTY MATCH', 280, 420);
          x.fillStyle = `rgba(198,247,220,${ok})`;
          x.font = '700 26px "IBM Plex Mono", monospace';
          x.fillText('APPROVED · SHIPMENT RECORDED', 280, 474);
        } else {
          x.fillStyle = '#8aa5ff';
          x.font = '700 34px Switzer, Arial';
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
      const warmUp = () => {
        if (!mount.isConnected) return;
        const hidden = [];
        scene.traverse(o => {
          if (!o.visible) {
            hidden.push(o);
            o.visible = true;
          }
        });
        try {
          renderer.compile(scene, camera);
        } catch (e) {}
        hidden.forEach(o => {
          o.visible = false;
        });
      };
      if (window.requestIdleCallback) requestIdleCallback(warmUp, {
        timeout: 4000
      });else setTimeout(warmUp, 1500);
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
        @media (hover:hover) and (pointer:fine){.video-play:hover svg{ transform: scale(1.06); }}
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
        @media (hover:hover) and (pointer:fine){.step:hover{ transform: translateY(-4px); border-color: var(--line-2); box-shadow: var(--shadow-md); }}
        .step.is-active::before{ transform: scaleX(1); }
@media (hover:hover) and (pointer:fine){.step:hover::before{ transform: scaleX(1); }}
        .step.is-active{ border-color: var(--line-3); background: linear-gradient(180deg, rgba(124,138,255,.10), rgba(124,138,255,.02)), var(--surface); }
        .step-num{
          font-family: var(--font-display); font-size: 34px; line-height: 1; letter-spacing: -0.02em;
          color: transparent; -webkit-text-stroke: 1.2px rgba(124,138,255,.5);
          transition: -webkit-text-stroke-color .35s var(--easing);
        }
        .step.is-active .step-num{ -webkit-text-stroke-color: var(--accent-2); }
@media (hover:hover) and (pointer:fine){.step:hover .step-num{ -webkit-text-stroke-color: var(--accent-2); }}
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

/* ---- Contact ---- */
(function(){
function Contact() {
  return React.createElement("section", {
    className: "finale",
    id: "contact"
  }, React.createElement("div", {
    className: "contact-slot",
    "aria-hidden": "true",
    "data-state": "approved",
    "data-lcd1": "APPROVED",
    "data-lcd2": "WELCOME"
  }), React.createElement("div", {
    className: "finale-card"
  }, React.createElement("h2", null, "Every dock deserves ", React.createElement("em", null, "a VeriGate"), "."), React.createElement("p", null, "Contact the owner for more details."), React.createElement("a", {
    href: "https://www.linkedin.com/in/osamasunaallah/",
    target: "_blank",
    rel: "noopener noreferrer",
    className: "btn primary"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: "16",
    height: "16",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"
  })), "Connect on LinkedIn")));
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
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !window.Lenis) return undefined;
    const lenis = new window.Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1.25
    });
    window.__lenis = lenis;
    let raf = 0;
    const loop = t => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = e => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, {
        offset: id === '#product' ? 0 : -70,
        duration: 1.6
      });
    };
    document.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onClick);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
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
  }), React.createElement(DeviceTour, null), React.createElement(Nav, null), React.createElement("main", null, React.createElement(Story, null), React.createElement(Process, null), React.createElement(Contact, null)), React.createElement(Footer, null));
}
if (!window.__verigateRoot) {
  window.__verigateRoot = ReactDOM.createRoot(document.getElementById('root'));
  window.__verigateRoot.render(React.createElement(App, null));
}
})();
