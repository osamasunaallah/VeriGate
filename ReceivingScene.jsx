/* ReceivingScene — the receiving loop as a 3D animation, in place of the
   process video.

   A driver walks across the dock with a box, taps his card on the real
   Verigate device (its LCD goes SCANNING → APPROVED), sets the box down
   and steps aside to wait. A worker carries it to the floor scale (walking
   round it, never over it), the scale reads the weight, and his iPad
   shows QTY MATCH · APPROVED.

   Everything is a pure function of time t (0..DUR seconds), so the
   parent can play, pause and scrub it like a video.
     props: timeRef — a ref holding the current time in seconds */

const RS_DUR = 26;

// chapter boundaries, in step order (matches the four step cards)
const RS_CHAPTERS = [0, 6.6, 9.8, 19.2];

function ReceivingScene({ timeRef }){
  const mountRef = React.useRef(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    let alive = true, raf = 0, ro = null, io = null;
    let visible = true;

    const start = () => {
      if (!alive) return;
      const THREE = window.THREE;
      const V3 = THREE.Vector3;
      const clamp01 = (x) => Math.max(0, Math.min(1, x));
      const seg = (t, a, b) => clamp01((t - a) / (b - a));
      const smooth = (x) => x * x * (3 - 2 * x);
      const lerp = (a, b, k) => a + (b - a) * k;
      const lerpV = (a, b, k) => new V3(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k));
      const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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

      /* ---------- light ---------- */
      scene.add(new THREE.HemisphereLight(0xb7c8ff, 0x1a1f33, 1.0));
      const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
      key.position.set(3, 7, 4); key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      Object.assign(key.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6, near: 1, far: 20 });
      key.shadow.bias = -0.0006;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x3b6bff, 1.2); rim.position.set(-5, 3, -6); scene.add(rim);
      const gateGlow = new THREE.PointLight(0x35d6ff, 0, 3.5); gateGlow.position.set(-.62, 1.4, -1.6); scene.add(gateGlow);

      /* ---------- materials ---------- */
      const M = (color, rough = .7, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
      const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
      const cardboard = canvasTex(256, 256, (x, w, h) => {
        x.fillStyle = '#b48552'; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++){ x.fillStyle = `rgba(80,50,20,${Math.random() * .08})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        x.fillStyle = 'rgba(214,190,150,.85)'; x.fillRect(w * .44, 0, w * .12, h);       // tape
        x.fillStyle = '#f4f1ea'; x.fillRect(w * .1, h * .62, w * .28, h * .2);           // label
        x.fillStyle = '#222'; for (let i = 0; i < 9; i++) x.fillRect(w * .12 + i * 7, h * .66, i % 3 ? 2 : 4, h * .1);
      });
      const boxMat = new THREE.MeshStandardMaterial({ map: cardboard, roughness: .85 });

      /* ---------- the dock ---------- */
      const add = (geo, mat, x, y, z, cast = true, recv = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; };
      const floorTex = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#1b2232'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(140,170,255,.09)'; x.lineWidth = 2; for (let i = 0; i <= 8; i++){ x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke(); } });
      floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(6, 5);
      const floor = add(new THREE.PlaneGeometry(26, 18), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .55, metalness: .2 }), 0, 0, 0, false);
      floor.rotation.x = -Math.PI / 2;
      // safety lines
      const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: .6, emissive: 0x2a1d00 });
      [[-2.6, 0.2, 7.5, .07], [1.95, -0.55, .07, 1.7], [1.95, -0.55, 1.7, .07]].forEach(([x, z, w, d]) => { const m = add(new THREE.PlaneGeometry(w, d), yellow, x, .003, z, false); m.rotation.x = -Math.PI / 2; });
      // back wall with a dock door
      const wallMat = M(0x2a3250, .9);
      add(new THREE.BoxGeometry(5.5, 4, .2), wallMat, 1.65, 2, -2.1);
      add(new THREE.BoxGeometry(2.6, 4, .2), wallMat, -7.6, 2, -2.1);
      add(new THREE.BoxGeometry(3.4, 1.0, .2), wallMat, -4.6, 3.5, -2.1);
      const doorFrame = M(0x2a3350, .6, .3);
      add(new THREE.BoxGeometry(.12, 3, .26), doorFrame, -6.3, 1.5, -2.1);
      add(new THREE.BoxGeometry(.12, 3, .26), doorFrame, -2.9, 1.5, -2.1);
      add(new THREE.BoxGeometry(3.5, .12, .26), doorFrame, -4.6, 3, -2.1);
      // truck backed up to the door
      const truck = M(0x8d96aa, .55, .25), trim = M(0x3a4152, .5, .5);
      add(new THREE.BoxGeometry(3.0, 3.0, 6), truck, -4.6, 1.75, -5.4);
      add(new THREE.BoxGeometry(.03, 2.8, .02), trim, -4.6, 1.75, -2.39, false);                       // door seam
      [-.75, .75].forEach(dx => add(new THREE.BoxGeometry(.04, 2.6, .05), trim, -4.6 + dx, 1.75, -2.38)); // lock bars
      [-1.42, 1.42].forEach(dx => [0.8, 1.75, 2.7].forEach(y => add(new THREE.BoxGeometry(.08, .16, .05), trim, -4.6 + dx, y, -2.38)));
      add(new THREE.BoxGeometry(3.0, .25, .3), M(0x222630, .6), -4.6, .45, -2.35);
      [-1.25, 1.25].forEach(dx => { const l = add(new THREE.BoxGeometry(.18, .1, .05), new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2a20, emissiveIntensity: 1.5 }), -4.6 + dx, .7, -2.42, false); });
      // racks with boxes on the right
      const rackMat = M(0x2b6cb0, .5, .4), shelfMat = M(0x3a4257, .6, .3);
      for (let r = 0; r < 2; r++){
        const rx = 5.0 + r * 1.9;
        [-.55, .55].forEach(dx => add(new THREE.BoxGeometry(.08, 3.2, .08), rackMat, rx + dx, 1.6, -3.2));
        [-.55, .55].forEach(dx => add(new THREE.BoxGeometry(.08, 3.2, .08), rackMat, rx + dx, 1.6, -4.2));
        for (let s = 0; s < 3; s++){
          add(new THREE.BoxGeometry(1.2, .06, 1.1), shelfMat, rx, .4 + s * 1.05, -3.7);
          for (let b = 0; b < 3; b++) add(new THREE.BoxGeometry(.32, .3, .4), boxMat, rx - .38 + b * .38, .58 + s * 1.05, -3.6 + (b % 2) * .15);
        }
      }
      // overhead lamps
      [[-3, -0.5], [1.5, -0.5], [-0.5, 2.5], [3.5, 2.5]].forEach(([x, z]) => {
        add(new THREE.CylinderGeometry(.35, .35, .05, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3dd, emissiveIntensity: 1.4 }), x, 4.2, z, false, false);
        const p = new THREE.PointLight(0xffe9cc, 9, 8, 2); p.position.set(x, 3.9, z); scene.add(p);
      });

      /* ---------- the gate column with the Verigate device ---------- */
      add(new THREE.BoxGeometry(.7, 2.4, .2), M(0x232a40, .7), -.62, 1.2, -1.95);
      const panelGlow = add(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ color: 0x3b6bff, transparent: true, opacity: .12 }), -.62, 1.38, -1.844, false, false);
      const LCD_W = 1024, LCD_H = 220;
      const lcdCanvas = document.createElement('canvas'); lcdCanvas.width = LCD_W; lcdCanvas.height = LCD_H;
      const lcdCtx = lcdCanvas.getContext('2d');
      const lcdTex = new THREE.CanvasTexture(lcdCanvas); lcdTex.colorSpace = THREE.SRGBColorSpace;
      let lcdState = '';
      const device = new THREE.Group(); device.position.set(-.62, 1.38, -1.82); scene.add(device);
      new GLTFLoader().loadAsync('./verigate-device.glb').then((gltf) => {
        if (!alive) return;
        const model = gltf.scene;
        const bb = new THREE.Box3().setFromObject(model), size = bb.getSize(new V3());
        model.position.sub(bb.getCenter(new V3()));
        const holder = new THREE.Group(); holder.add(model);
        holder.scale.setScalar(.3 / Math.max(size.x, size.y, size.z));
        model.traverse(o => { if (!o.isMesh) return; o.castShadow = true;
          if (o.name === 'LCD_Screen_Plane') o.material = new THREE.MeshBasicMaterial({ map: lcdTex, toneMapped: false }); });
        // the model's front is +z in its own space; it faces the driver here
        device.add(holder);
      }).catch(err => console.error('[ReceivingScene] device GLB failed:', err));

      /* ---------- the floor scale with its terminal ---------- */
      const scaleTop = add(new THREE.BoxGeometry(1.4, .1, 1.4), M(0x5b6478, .35, .7), 1.95, .05, -.55);
      add(new THREE.BoxGeometry(1.5, .04, 1.5), M(0x262c3d, .6, .3), 1.95, .02, -.55, false);
      add(new THREE.CylinderGeometry(.04, .05, 1.05, 12), M(0x8a93a8, .3, .8), 2.95, .52, -1.35);
      const scaleCanvas = document.createElement('canvas'); scaleCanvas.width = 512; scaleCanvas.height = 160;
      const scaleCtx = scaleCanvas.getContext('2d');
      const scaleTex = new THREE.CanvasTexture(scaleCanvas); scaleTex.colorSpace = THREE.SRGBColorSpace;
      const head = new THREE.Group(); head.position.set(2.95, 1.12, -1.33); head.rotation.y = -.55; scene.add(head);
      const headBox = new THREE.Mesh(new THREE.BoxGeometry(.46, .2, .12), M(0x1b2132, .5, .3)); headBox.castShadow = true; head.add(headBox);
      const scaleScreen = new THREE.Mesh(new THREE.PlaneGeometry(.4, .125), new THREE.MeshBasicMaterial({ map: scaleTex, toneMapped: false })); scaleScreen.position.z = .061; head.add(scaleScreen);
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(.4, .03, .3), M(0x2a3147, .6, .3)); shelf.position.set(0, -.14, .1); head.add(shelf);
      let scaleShown = '';
      const drawScale = (kg, settled) => {
        const txt = kg.toFixed(1).padStart(5, ' ') + ' kg';
        if (txt + settled === scaleShown) return; scaleShown = txt + settled;
        const x = scaleCtx, w = 512, h = 160;
        x.fillStyle = '#031208'; x.fillRect(0, 0, w, h);
        x.font = '700 104px "JetBrains Mono", Consolas, monospace'; x.textAlign = 'right'; x.textBaseline = 'middle';
        x.fillStyle = 'rgba(40,255,140,.08)'; x.fillText('888.8 kg', w - 24, h / 2 + 4);
        x.shadowColor = 'rgba(60,255,150,.9)'; x.shadowBlur = 22; x.fillStyle = settled ? '#5dff9c' : '#3fd07a';
        x.fillText(txt, w - 24, h / 2 + 4); x.shadowBlur = 0;
        if (settled){ x.fillStyle = '#5dff9c'; x.font = '700 26px "JetBrains Mono", monospace'; x.textAlign = 'left'; x.fillText('STABLE', 22, 30); }
        scaleTex.needsUpdate = true;
      };

      /* ---------- the iPad ---------- */
      const padCanvas = document.createElement('canvas'); padCanvas.width = 800; padCanvas.height = 560;
      const padCtx = padCanvas.getContext('2d');
      const padTex = new THREE.CanvasTexture(padCanvas); padTex.colorSpace = THREE.SRGBColorSpace; padTex.anisotropy = 8;
      const pad = new THREE.Group(); scene.add(pad);
      const padBody = new THREE.Mesh(new THREE.BoxGeometry(.3, .21, .012), M(0x1c1e24, .4, .6)); padBody.castShadow = true; pad.add(padBody);
      const padScreen = new THREE.Mesh(new THREE.PlaneGeometry(.28, .19), new THREE.MeshBasicMaterial({ map: padTex, toneMapped: false })); padScreen.position.z = .0065; pad.add(padScreen);
      let padShown = '';
      const drawPad = (mode, kg) => {
        const key = mode + '|' + kg.toFixed(1); if (key === padShown) return; padShown = key;
        const x = padCtx, w = 800, h = 560;
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1124'); g.addColorStop(1, '#070a17');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = '#111a33'; x.fillRect(0, 0, w, 64);
        x.fillStyle = '#8aa5ff'; x.font = '700 26px "Inter", Arial'; x.textBaseline = 'middle'; x.fillText('VERIGATE · Receiving', 28, 33);
        x.fillStyle = '#6fe3ff'; x.font = '600 20px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.fillText('PO-4471 · DRV-0417', w - 28, 33); x.textAlign = 'left';
        const row = (y, k, v, col = '#e6ecff') => { x.fillStyle = '#7480a6'; x.font = '500 24px "Inter", Arial'; x.fillText(k, 40, y); x.fillStyle = col; x.font = '700 30px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.fillText(v, w - 40, y); x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(40, y + 26, w - 80, 2); };
        row(118, 'Expected weight', '250.0 kg');
        row(182, 'Measured weight', mode === 'idle' ? '— — —' : kg.toFixed(1) + ' kg', mode === 'match' ? '#5dff9c' : '#e6ecff');
        row(246, 'Expected qty', '24 cartons');
        row(310, 'Counted qty', mode === 'match' ? '24 cartons' : '…', mode === 'match' ? '#5dff9c' : '#e6ecff');
        if (mode === 'match'){
          x.fillStyle = '#0e7a46'; x.beginPath(); x.roundRect(40, 368, w - 80, 150, 22); x.fill();
          x.strokeStyle = '#3dff9a'; x.lineWidth = 3; x.stroke();
          x.fillStyle = '#eafff3'; x.font = '800 56px "Inter", Arial'; x.textAlign = 'center'; x.fillText('✓  QTY MATCH', w / 2, 425);
          x.font = '700 30px "JetBrains Mono", monospace'; x.fillStyle = '#c6f7dc'; x.fillText('APPROVED · SHIPMENT RECORDED', w / 2, 482); x.textAlign = 'left';
        } else {
          x.fillStyle = '#16204a'; x.beginPath(); x.roundRect(40, 368, w - 80, 150, 22); x.fill();
          x.fillStyle = '#8aa5ff'; x.font = '700 40px "Inter", Arial'; x.textAlign = 'center'; x.fillText(mode === 'idle' ? 'Waiting for the scale…' : 'Reconciling…', w / 2, 443); x.textAlign = 'left';
        }
        padTex.needsUpdate = true;
      };

      /* ---------- the box and the card ---------- */
      const box = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .42), boxMat); box.castShadow = true; box.receiveShadow = true; scene.add(box);
      const card = new THREE.Mesh(new THREE.BoxGeometry(.085, .055, .004), new THREE.MeshStandardMaterial({ color: 0xf4f6fb, roughness: .4, emissive: 0x223366, emissiveIntensity: .2 })); scene.add(card);

      /* ---------- people: jointed figures with a proper gait ---------- */
      function person({ shirt, pants, skin, hair, capColor, vest }){
        const root = new THREE.Group(); scene.add(root);
        const mk = (geo, mat, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
        const shirtM = M(shirt, .8), pantsM = M(pants, .85), skinM = M(skin, .65), shoeM = M(0x121317, .5), hairM = M(hair, .9);
        const hips = new THREE.Group(); hips.position.y = .95; root.add(hips);
        mk(new THREE.CapsuleGeometry(.13, .1, 6, 14), pantsM, hips, 0, -.02, 0).scale.set(1.3, 1, .8);
        mk(new THREE.TorusGeometry(.165, .018, 8, 24), M(0x151515, .4, .4), hips, 0, .07, 0).rotation.x = Math.PI / 2;   // belt
        const spine = new THREE.Group(); spine.position.y = .05; hips.add(spine);
        mk(new THREE.CapsuleGeometry(.165, .32, 8, 16), shirtM, spine, 0, .3, 0).scale.set(1.1, 1, .66);
        if (vest){
          const vestM = new THREE.MeshStandardMaterial({ color: vest, roughness: .6, emissive: vest, emissiveIntensity: .12 });
          mk(new THREE.CapsuleGeometry(.17, .26, 8, 16), vestM, spine, 0, .3, 0).scale.set(1.12, 1, .7);
          const stripe = new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: .25, metalness: .8, emissive: 0x9aa4b0, emissiveIntensity: .25 });
          [.22, .36].forEach(y => { const st = mk(new THREE.TorusGeometry(.172, .012, 6, 32), stripe, spine, 0, y, 0); st.rotation.x = Math.PI / 2; st.scale.set(1.12, .7, 1); });
        }
        mk(new THREE.CylinderGeometry(.05, .058, .09, 12), skinM, spine, 0, .6, 0);
        const headG = new THREE.Group(); headG.position.y = .74; spine.add(headG);
        mk(new THREE.SphereGeometry(.105, 24, 18), skinM, headG, 0, 0, 0).scale.set(.94, 1.1, 1);
        mk(new THREE.SphereGeometry(.022, 10, 8), skinM, headG, 0, -.01, .1);                                         // nose
        [-.1, .1].forEach(x => mk(new THREE.SphereGeometry(.022, 10, 8), skinM, headG, x, 0, 0));                      // ears
        if (capColor){
          const capM = M(capColor, .7);
          mk(new THREE.SphereGeometry(.11, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), capM, headG, 0, .03, 0).scale.set(1, .95, 1.05);
          mk(new THREE.CylinderGeometry(.1, .1, .012, 24, 1, false, -Math.PI / 2, Math.PI), capM, headG, 0, .03, .07).scale.set(1, 1, .9);
        } else mk(new THREE.SphereGeometry(.11, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.1), hairM, headG, 0, .025, -.012);
        const limb = (parent, x, y, r1, l1, r2, l2, m1, m2, isLeg) => {
          const a = new THREE.Group(); a.position.set(x, y, 0); parent.add(a);
          mk(new THREE.CapsuleGeometry(r1, l1, 4, 12), m1, a, 0, -l1 / 2 - r1 * .4, 0);
          const b = new THREE.Group(); b.position.y = -l1 - r1 * .9; a.add(b);
          mk(new THREE.CapsuleGeometry(r2, l2, 4, 12), m2, b, 0, -l2 / 2 - r2 * .4, 0);
          const c = new THREE.Group(); c.position.y = -l2 - r2 * 1.1; b.add(c);
          const end = isLeg ? mk(new THREE.BoxGeometry(.11, .075, .26), shoeM, c, 0, -.02, .05)
                            : mk(new THREE.SphereGeometry(.05, 14, 10), skinM, c, 0, -.03, .005);
          if (!isLeg) end.scale.set(.85, 1.15, .7);
          return { a, b, c, end };
        };
        const armL = limb(spine, .215, .54, .05, .22, .044, .2, shirtM, skinM, false);
        const armR = limb(spine, -.215, .54, .05, .22, .044, .2, shirtM, skinM, false);
        const legL = limb(hips, .09, -.06, .07, .34, .058, .35, pantsM, pantsM, true);
        const legR = limb(hips, -.09, -.06, .07, .34, .058, .35, pantsM, pantsM, true);

        // ph: gait phase (radians), amp 0..1 how much it walks, bend 0..1 (crouch), arms [shoulderX, shoulderZ, elbowX], swing 0..1 free arms
        const pose = ({ ph = 0, amp = 0, bend = 0, armL: aL, armR: aR, swing = 0, idle = 0 }) => {
          const legs = [[legL, ph], [legR, ph + Math.PI]];
          legs.forEach(([L, p]) => {
            const thigh = -Math.sin(p) * .46 * amp;
            const knee = (Math.max(0, Math.sin(p - 1.1)) * 1.0 + .06) * amp;
            L.a.rotation.x = thigh - bend * 1.15;
            L.b.rotation.x = knee + bend * 2.0;
            L.c.rotation.x = -(thigh + knee) * .55 * amp - bend * .85 + Math.max(0, -Math.sin(p)) * .25 * amp;   // keep the sole level, roll off the toe
          });
          hips.position.y = .95 - bend * .33 - Math.cos(ph * 2) * .02 * amp;
          hips.position.x = Math.sin(ph) * .018 * amp;
          hips.rotation.y = Math.sin(ph) * .13 * amp;
          spine.rotation.set(bend * .72 + .04 * amp, -Math.sin(ph) * .2 * amp, Math.sin(ph) * .03 * amp + Math.sin(idle * 1.3) * .008);
          headG.rotation.set(-bend * .35 - .04 * amp, -(spine.rotation.y + hips.rotation.y) * .9, 0);
          const sw = Math.sin(ph) * .5 * amp * swing;
          armL.a.rotation.set(aL[0] + sw, 0, aL[1]); armL.b.rotation.x = aL[2] - Math.max(0, sw) * .4; armL.c.rotation.x = -.1;
          armR.a.rotation.set(aR[0] - sw, 0, aR[1]); armR.b.rotation.x = aR[2] - Math.max(0, -sw) * .4; armR.c.rotation.x = -.1;
        };
        return { root, hips, spine, armL, armR, pose };
      }
      const driver = person({ shirt: 0x203258, pants: 0x2a2f3a, skin: 0xc99a7a, hair: 0x2b1d14, capColor: 0x1d2c52, vest: 0xc6e03a });
      const worker = person({ shirt: 0x1d5240, pants: 0x2b2f3a, skin: 0xb98563, hair: 0x1b130e });
      const handWorld = (p, arm) => arm.end.getWorldPosition(new V3());

      /* ---------- keyframe tracks: every pose, turn and move blends, nothing snaps ---------- */
      const REST_L = [.02, .1, -.18], REST_R = [.02, -.1, -.18];
      const CARRY_L = [-1.02, -.34, -.78], CARRY_R = [-1.02, .34, -.78];
      const ONE_L = [-.9, -.12, -1.0];
      const CARD_R = [-.55, -.05, -.9], SCAN_R = [-1.42, -.6, -.2], TAP_R = [-1.5, -.62, -.12];
      const PAD_L = [-1.18, -.2, -1.05], PAD_R = [-1.02, .38, -1.2], REACH_L = [-1.15, -.05, -.45];
      const blendTrack = (keys, t, f) => {
        if (t <= keys[0].t) return keys[0][f];
        for (let i = 0; i < keys.length - 1; i++){
          const A = keys[i], B = keys[i + 1];
          if (t < B.t){ const k = smooth((t - A.t) / (B.t - A.t)); const a = A[f], b = B[f];
            return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : typeof a === 'number' ? (f === 'rot' ? angLerp(a, b, k) : lerp(a, b, k)) : lerpV(a, b, k); }
        }
        return keys[keys.length - 1][f];
      };
      // walk path: position, distance walked (drives the gait so feet don't slide) and walk amount
      const pathAt = (keys, t) => {
        let dist = 0;
        for (let i = 0; i < keys.length - 1; i++){
          const A = keys[i], B = keys[i + 1], len = A.p.distanceTo(B.p);
          if (t < B.t){
            if (t <= A.t) return { p: A.p.clone(), dist, amp: 0 };
            const u = (t - A.t) / (B.t - A.t), k = len > .01 ? smooth(u) : 0;
            const amp = len > .01 ? Math.min(1, Math.sin(Math.PI * u) * 2.2) : 0;
            return { p: lerpV(A.p, B.p, k), dist: dist + len * k, amp };
          }
          dist += len;
        }
        return { p: keys[keys.length - 1].p.clone(), dist, amp: 0 };
      };
      const STRIDE = 1.25;    // metres per full gait cycle

      // the driver starts on the dock floor (already off the truck) and, after the drop-off, steps aside and waits
      const S0 = new V3(-4.0, 0, .45), G = new V3(-1.2, 0, -1.25), D2 = new V3(-.35, 0, -.56), WAIT = new V3(-1.55, 0, -.15);
      const DROP = new V3(-.35, .16, -1.05);
      // the worker walks round the scale, never across it: WA/WS in front of it, WC past its right corner, WT beside the terminal
      const W0 = new V3(6.4, 0, 1.4), WB = new V3(.32, 0, -1.05), WA = new V3(.95, 0, .72), WS = new V3(1.95, 0, .72), WC = new V3(3.0, 0, .6), WT = new V3(3.22, 0, -.68);
      const TERM = new V3(2.95, 0, -1.33);
      const SCALE_TOP = new V3(1.95, .1 + .16, -.08);
      const H = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);

      const DRV_PATH = [{ t: 0, p: S0 }, { t: .8, p: S0 }, { t: 5, p: G }, { t: 8.5, p: G }, { t: 9.3, p: D2 }, { t: 10.7, p: D2 }, { t: 11.9, p: WAIT }];
      const DRV = [
        { t: 0,    rot: H(S0, G), armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 5,    rot: H(S0, G), armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 5.7,  rot: Math.PI,  armL: ONE_L,   armR: CARD_R,  bend: 0, swing: 0 },
        { t: 6.25, rot: Math.PI,  armL: ONE_L,   armR: SCAN_R,  bend: 0, swing: 0 },
        { t: 6.55, rot: Math.PI,  armL: ONE_L,   armR: TAP_R,   bend: 0, swing: 0 },
        { t: 7.7,  rot: Math.PI,  armL: ONE_L,   armR: TAP_R,   bend: 0, swing: 0 },
        { t: 8.1,  rot: Math.PI,  armL: ONE_L,   armR: CARD_R,  bend: 0, swing: 0 },
        { t: 8.6,  rot: H(G, D2), armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 9.3,  rot: Math.PI,  armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 9.95, rot: Math.PI,  armL: [-.75, -.3, -.55], armR: [-.75, .3, -.55], bend: 1, swing: 0 },
        { t: 10.15, rot: Math.PI, armL: [-.75, -.3, -.55], armR: [-.75, .3, -.55], bend: 1, swing: 0 },
        { t: 10.7, rot: H(D2, WAIT), armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 11.8, rot: H(D2, WAIT), armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 12.6, rot: H(WAIT, new V3(1.2, 0, -.5)), armL: REST_L, armR: REST_R, bend: 0, swing: 0 },
      ];
      const WRK_PATH = [{ t: 0, p: W0 }, { t: 10.6, p: W0 }, { t: 13.5, p: WB }, { t: 14.9, p: WB }, { t: 15.95, p: WA }, { t: 16.7, p: WS }, { t: 17.9, p: WS }, { t: 18.55, p: WC }, { t: 19.3, p: WT }];
      const WRK = [
        { t: 0,     rot: H(W0, WB), armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 13.3,  rot: H(W0, WB), armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 13.6,  rot: -Math.PI / 2, armL: REST_L, armR: REST_R, bend: 0, swing: 0 },
        { t: 14.15, rot: -Math.PI / 2, armL: [-.75, -.3, -.55], armR: [-.75, .3, -.55], bend: 1, swing: 0 },
        { t: 14.3,  rot: -Math.PI / 2, armL: [-.75, -.3, -.55], armR: [-.75, .3, -.55], bend: 1, swing: 0 },
        { t: 14.9,  rot: H(WB, WA), armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 15.7,  rot: H(WB, WA), armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 16.2,  rot: H(WA, WS), armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 16.75, rot: Math.PI, armL: CARRY_L, armR: CARRY_R, bend: 0, swing: 0 },
        { t: 17.3,  rot: Math.PI, armL: [-1.15, -.3, -.4], armR: [-1.15, .3, -.4], bend: .55, swing: 0 },
        { t: 17.45, rot: Math.PI, armL: [-1.15, -.3, -.4], armR: [-1.15, .3, -.4], bend: .55, swing: 0 },
        { t: 17.85, rot: Math.PI, armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 18.2,  rot: H(WS, WC), armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 18.55, rot: H(WC, WT), armL: REST_L, armR: REST_R, bend: 0, swing: 1 },
        { t: 19.3,  rot: H(WT, TERM), armL: REST_L, armR: REST_R, bend: 0, swing: 0 },
        { t: 19.55, rot: H(WT, TERM), armL: REACH_L, armR: REST_R, bend: .1, swing: 0 },
        { t: 19.75, rot: H(WT, TERM), armL: REACH_L, armR: REST_R, bend: .1, swing: 0 },
        { t: 20.5,  rot: .45,      armL: PAD_L, armR: PAD_R, bend: 0, swing: 0 },
      ];

      /* ---------- effects: RFID rings, beacon, approval tick, scale halo ---------- */
      const fx = (geo, color) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(m); return m; };
      const rings = [0, 1, 2].map(() => { const r = fx(new THREE.RingGeometry(.07, .082, 48), 0x35d6ff); r.position.set(-.62, 1.33, -1.79); return r; });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0x3b6bff })); beacon.position.set(-.62, 2.5, -1.82); scene.add(beacon);
      const beaconHalo = fx(new THREE.SphereGeometry(.09, 16, 12), 0x3b6bff); beaconHalo.position.copy(beacon.position);
      const lcdHalo = fx(new THREE.PlaneGeometry(.55, .3), 0x35d6ff); lcdHalo.position.set(-.62, 1.42, -1.835);
      const tickTex = canvasTex(256, 256, (x, w, h) => { x.strokeStyle = '#5dff9c'; x.lineWidth = 18; x.lineCap = 'round'; x.shadowColor = '#3dff9a'; x.shadowBlur = 24;
        x.beginPath(); x.arc(w / 2, h / 2, 92, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(82, 132); x.lineTo(116, 166); x.lineTo(178, 96); x.stroke(); });
      const tick = new THREE.Sprite(new THREE.SpriteMaterial({ map: tickTex, transparent: true, opacity: 0, depthWrite: false })); tick.scale.set(.26, .26, 1); scene.add(tick);
      const halo = fx(new THREE.RingGeometry(.95, 1.02, 64), 0x3dff9a); halo.rotation.x = -Math.PI / 2; halo.position.set(1.95, .012, -.55);

      /* ---------- iPad screen with a live progress bar and an animated tick ---------- */
      let padKey = '';
      const drawPad2 = (t, kg) => {
        const prog = clamp01(seg(t, 20.1, 21.3)), ok = clamp01(seg(t, 21.3, 21.8));
        const key = (t < 17.4 ? 'i' : '') + prog.toFixed(2) + ok.toFixed(2) + kg.toFixed(0);
        if (key === padKey) return; padKey = key;
        const x = padCtx, w = 800, h = 560;
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1124'); g.addColorStop(1, '#070a17');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = '#111a33'; x.fillRect(0, 0, w, 64);
        x.textBaseline = 'middle'; x.textAlign = 'left';
        x.fillStyle = '#8aa5ff'; x.font = '700 26px Inter, Arial'; x.fillText('VERIGATE · Receiving', 28, 33);
        x.fillStyle = '#6fe3ff'; x.font = '600 20px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.fillText('PO-4471 · DRV-0417', w - 28, 33); x.textAlign = 'left';
        const row = (y, k, v, col) => { x.fillStyle = '#7480a6'; x.font = '500 24px Inter, Arial'; x.fillText(k, 40, y); x.fillStyle = col || '#e6ecff'; x.font = '700 30px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.fillText(v, w - 40, y); x.textAlign = 'left'; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(40, y + 26, w - 80, 2); };
        const green = '#5dff9c';
        row(112, 'Expected weight', '250.0 kg');
        row(176, 'Measured weight', t < 17.4 ? '— — —' : kg.toFixed(1) + ' kg', ok > 0 ? green : null);
        row(240, 'Expected qty', '24 cartons');
        row(304, 'Counted qty', ok > 0 ? '24 / 24' : prog > 0 ? Math.round(prog * 24) + ' / 24' : '…', ok > 0 ? green : null);
        x.save(); x.beginPath(); x.roundRect(40, 360, w - 80, 160, 24); x.clip();
        x.fillStyle = ok > 0 ? `rgb(${lerp(22, 14, ok)},${lerp(32, 122, ok)},${lerp(74, 70, ok)})` : '#16204a'; x.fillRect(40, 360, w - 80, 160);
        if (ok > 0){
          x.globalAlpha = ok; x.strokeStyle = '#3dff9a'; x.lineWidth = 4; x.strokeRect(42, 362, w - 84, 156); x.globalAlpha = 1;
          // tick draws itself
          x.strokeStyle = '#eafff3'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath();
          const p1 = Math.min(1, ok * 2), p2 = Math.max(0, ok * 2 - 1);
          x.moveTo(150, 440); x.lineTo(150 + 28 * p1, 440 + 28 * p1); if (p2 > 0) x.lineTo(178 + 56 * p2, 468 - 64 * p2); x.stroke();
          x.fillStyle = `rgba(234,255,243,${ok})`; x.font = '800 54px Inter, Arial'; x.fillText('QTY MATCH', 280, 420);
          x.fillStyle = `rgba(198,247,220,${ok})`; x.font = '700 26px "JetBrains Mono", monospace'; x.fillText('APPROVED · SHIPMENT RECORDED', 280, 474);
        } else {
          x.fillStyle = '#8aa5ff'; x.font = '700 34px Inter, Arial'; x.textAlign = 'center';
          x.fillText(t < 17.4 ? 'Waiting for the scale…' : 'Reconciling with the manifest…', w / 2, 420); x.textAlign = 'left';
          x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(110, 462, w - 220, 14, 7); x.fill();
          const gb = x.createLinearGradient(110, 0, w - 110, 0); gb.addColorStop(0, '#3b6bff'); gb.addColorStop(1, '#35d6ff');
          x.fillStyle = gb; x.beginPath(); x.roundRect(110, 462, (w - 220) * prog, 14, 7); x.fill();
        }
        x.restore();
        padTex.needsUpdate = true;
      };

      /* ---------- camera: a tracking shot, then glides between framed shots ---------- */
      const camState = (t) => {
        const follow = pathAt(DRV_PATH, Math.min(t, 5)).p;
        return [
          { t0: 0,    a: [follow.clone().add(new V3(2.4, 1.85, 4.3)), follow.clone().add(new V3(.2, 1.05, -.4))], b: null },
          { t0: 5.0,  a: [new V3(1.0, 1.85, .25), new V3(-.68, 1.36, -1.8)], b: [new V3(.62, 1.62, -.22), new V3(-.68, 1.33, -1.8)] },
          { t0: 8.6,  a: [new V3(1.7, 2.6, 4.5), new V3(-.25, .7, -1.0)], b: [new V3(1.25, 2.3, 3.7), new V3(.05, .6, -.9)] },
          { t0: 13.8, a: [new V3(4.4, 2.2, 3.4), new V3(1.5, .6, -.55)], b: [new V3(3.6, 1.75, 2.5), new V3(1.95, .5, -.4)] },
          { t0: 19.5, pad: true },
          { t0: 23.4, a: [new V3(1.7, 3.4, 7.3), new V3(.6, .8, -1.0)], b: [new V3(1.25, 3.1, 6.6), new V3(.6, .8, -1.0)] },
        ];
      };
      const padCam = () => { const p = pad.getWorldPosition(new V3()); const n = new V3(0, 0, 1).applyQuaternion(pad.getWorldQuaternion(new THREE.Quaternion()));
        return [p.clone().add(n.multiplyScalar(.82)).add(new V3(.12, .05, 0)), p.clone().add(new V3(0, .02, 0))]; };
      function cameraAt(t){
        const shots = camState(t);
        const frameOf = (i) => {
          const s = shots[i]; if (s.pad) return padCam();
          if (!s.b) return s.a;
          const end = i + 1 < shots.length ? shots[i + 1].t0 : RS_DUR;
          const k = smooth(seg(t, s.t0, end));
          return [lerpV(s.a[0], s.b[0], k), lerpV(s.a[1], s.b[1], k)];
        };
        let i = 0; while (i < shots.length - 1 && t >= shots[i + 1].t0) i++;
        const cur = frameOf(i), blend = 1.6;
        if (i > 0 && t - shots[i].t0 < blend){ const prev = frameOf(i - 1), k = smooth(smooth((t - shots[i].t0) / blend)); return [lerpV(prev[0], cur[0], k), lerpV(prev[1], cur[1], k)]; }
        return cur;
      }

      /* ---------- render one moment ---------- */
      function renderAt(t){
        // people
        const dp = pathAt(DRV_PATH, t), wp = pathAt(WRK_PATH, t);
        driver.root.position.copy(dp.p); driver.root.rotation.y = blendTrack(DRV, t, 'rot');
        driver.pose({ ph: dp.dist / STRIDE * Math.PI * 2, amp: dp.amp, bend: blendTrack(DRV, t, 'bend'), armL: blendTrack(DRV, t, 'armL'), armR: blendTrack(DRV, t, 'armR'), swing: blendTrack(DRV, t, 'swing'), idle: t });
        driver.root.visible = true;
        worker.root.position.copy(wp.p); worker.root.rotation.y = blendTrack(WRK, t, 'rot');
        worker.pose({ ph: wp.dist / STRIDE * Math.PI * 2, amp: wp.amp, bend: blendTrack(WRK, t, 'bend'), armL: blendTrack(WRK, t, 'armL'), armR: blendTrack(WRK, t, 'armR'), swing: blendTrack(WRK, t, 'swing'), idle: t + 2 });
        worker.root.visible = t > 10.4;
        scene.updateMatrixWorld(true);

        // the box moves continuously: driver's hands -> floor -> worker's hands -> scale
        const between = (p) => handWorld(p, p.armL).add(handWorld(p, p.armR)).multiplyScalar(.5).add(new V3(0, .05, 0).applyAxisAngle(new V3(0, 1, 0), p.root.rotation.y));
        const oneHand = handWorld(driver, driver.armL).add(new V3(-.05, .12, 0));
        let bp, brot;
        if (t < 10.0){
          const w1 = smooth(seg(t, 5.2, 5.7)) * (1 - smooth(seg(t, 8.1, 8.6)));
          bp = lerpV(between(driver), oneHand, w1);
          bp = lerpV(bp, DROP, smooth(seg(t, 9.6, 9.98)));
          brot = driver.root.rotation.y;
        } else if (t < 14.3){
          bp = lerpV(DROP, between(worker), smooth(seg(t, 14.0, 14.3)));
          brot = lerp(Math.PI, worker.root.rotation.y, smooth(seg(t, 14.0, 14.3)));
        } else {
          const land = smooth(seg(t, 17.0, 17.4));
          bp = lerpV(between(worker), SCALE_TOP, land); bp.y += Math.sin(land * Math.PI) * .04;
          brot = angLerp(worker.root.rotation.y, Math.PI, land);
        }
        box.position.copy(bp); box.rotation.set(0, brot, 0);
        // the scale platform gives a little when the box lands
        const sinceLand = t - 17.4;
        scaleTop.position.y = .05 - (sinceLand > 0 ? .012 * Math.exp(-sinceLand * 5) * Math.cos(sinceLand * 22) + .004 : 0);
        if (sinceLand > 0) box.position.y += scaleTop.position.y - .05;

        // card: in the driver's right hand while he taps
        const cardOn = t > 5.4 && t < 8.3;
        card.visible = cardOn;
        if (cardOn){ card.position.copy(handWorld(driver, driver.armR)).add(new V3(0, .02, -.035)); card.rotation.set(0, Math.PI, 0); }

        // iPad: rests on the terminal shelf, slides into the worker's hands
        const shelfP = head.localToWorld(new V3(0, -.11, .12));
        const shelfQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + .2, head.rotation.y, 0, 'YXZ'));
        const handsP = handWorld(worker, worker.armL).add(handWorld(worker, worker.armR)).multiplyScalar(.5).add(new V3(0, .1, 0));
        const handsQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.42, worker.root.rotation.y, 0, 'YXZ'));
        const take = smooth(seg(t, 19.6, 20.1));
        pad.position.copy(lerpV(shelfP, handsP, take));
        pad.quaternion.copy(shelfQ).slerp(handsQ, take);

        // gate device: LCD, halo, rings, beacon, approval tick
        const lcd = t < 6.6 ? { lcdLine1: 'VERIGATE', lcdLine2: 'READY · SCAN', state: 'idle' }
                  : t < 7.5 ? { lcdLine1: 'SCANNING', lcdLine2: 'CARD · DRV-0417', state: 'scanning' }
                  : t < 11.5 ? { lcdLine1: 'APPROVED', lcdLine2: 'WELCOME · DRV-0417', state: 'approved' }
                  : { lcdLine1: 'VERIGATE', lcdLine2: 'READY · SCAN', state: 'idle' };
        if (typeof drawLCD === 'function'){ drawLCD(lcdCtx, lcdCanvas, lcd, t * 1000); lcdTex.needsUpdate = true; }
        const approved = lcd.state === 'approved', scanning = lcd.state === 'scanning';
        rings.forEach((r, j) => { const p = seg(t, 6.6 + j * .25, 7.6 + j * .25); r.material.opacity = p > 0 && p < 1 ? (1 - p) * .9 : 0; r.scale.setScalar(1 + p * 3.2); });
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

        // scale readout and the halo when the weight matches
        const wk = t < 17.4 ? 0 : t < 18.4 ? 250 * smooth(seg(t, 17.4, 18.4)) + Math.sin(t * 34) * 5 * (1 - seg(t, 17.4, 18.4)) : 250;
        drawScale(Math.max(0, wk), t >= 18.4);
        const hp = seg(t, 18.4, 19.4);
        halo.material.opacity = hp > 0 && hp < 1 ? (1 - hp) * .8 : 0; halo.scale.setScalar(1 + hp * .35);
        drawPad2(t, Math.max(0, wk));

        // camera
        const [cp, ct] = cameraAt(t);
        camera.position.copy(cp); camera.lookAt(ct);
        renderer.render(scene, camera);
      }
      function backOutS(x){ const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }

      const size = () => {
        const w = Math.max(mount.clientWidth, 200), h = Math.max(mount.clientHeight, 150);
        camera.aspect = w / h; camera.fov = w / h < 1.2 ? 50 : 40; camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      ro = new ResizeObserver(size); ro.observe(mount); size();
      io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }); io.observe(mount);

      let last = -1, lastPaint = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden) return;
        const t = Math.max(0, Math.min(RS_DUR, timeRef.current));
        // re-render when time moves, and a few times a second while paused (LCD cursor)
        if (t !== last || performance.now() - lastPaint > 120){ last = t; lastPaint = performance.now(); renderAt(t); }
      };
      loop();

      mount.__dispose = () => {
        renderer.dispose();
        [cardboard, floorTex, lcdTex, scaleTex, padTex].forEach(x => x.dispose());
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    };

    if (window.__threeReady) start();
    else window.addEventListener('threeready', start, { once: true });
    return () => {
      alive = false; cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); if (io) io.disconnect();
      if (mount.__dispose) mount.__dispose();
    };
  }, []);

  return <div ref={mountRef} className="rs-mount" />;
}

window.ReceivingScene = ReceivingScene;
window.RS_DUR = RS_DUR;
window.RS_CHAPTERS = RS_CHAPTERS;
