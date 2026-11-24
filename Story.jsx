/* Story: the top of the page as one pinned screen (23.11.2026).
   The page scrolls past a sticky stage. Each chapter is a short piece of text
   on one side; the page-wide 3D device (DeviceTour) sits on the other side.
   Everything is a pure function of the scroll position, so the device moves
   exactly as far as you scroll: it holds still while you read a chapter and
   glides to its next place between chapters.
   Every frame this writes window.__vgTarget for DeviceTour. */

const STORY = [
  // the hero (24.11.2026, Osama): the device large and upright, turned a little to the left,
  // its base sinking into a soft light haze; no floor, only a faint sway
  // the device stands still and the bottom edge of the screen cuts it off: `show` is the part that stays
  // on screen. Phones: text on top, the device under it, never under the text.
  // 24.11.2026: upright, the face turned left so its right side shows; a very small, slow sway
  { id: 'product', len: 0.6,  dev: 'r', yaw: -0.62, pitch: 0, roll: 0, spin: 1, sway: 0.035, floor: 0, hero: 1,
    size: 1.15, cxw: 0.75, maxw: 0.56, show: 0.8, 
    mob: { size: 0.95, maxw: 1.1, show: 0.86, dh: 0.69 } },   // maxw 1.1: side margins on phones (24.11.2026)
  { id: 'build',   len: 1.5,  dev: 'r', yaw: -0.5,  pitch: 0.2,  size: 0.6,  build: 1 },
  { id: 'problem', len: 0.62, dev: 'l', yaw: 0.75,  pitch: 0.22, size: 0.52, lcd1: 'NO RECORD', lcd2: 'PAPER ONLY', state: 'warn' },
  { id: 'how',     len: 0.95, dev: 'r', yaw: -0.7,  pitch: 0.2,  size: 0.56 },
  { id: 'gate',    len: 0.62, dev: 'l', yaw: 0.8,   pitch: 0.22, size: 0.52, lcd1: 'TAP CARD', lcd2: 'UNDER 200 MS' },
];
const STORY_RUN = STORY.reduce((a, c) => a + c.len, 0);

const BUILD_STEPS = [
  { at: 0,    t: 'The shell',      s: 'A matte-black case with the switch on its side.' },
  { at: 0.14, t: 'Arduino UNO R4', s: 'The brain of the device.' },
  { at: 0.28, t: 'RC522 reader',   s: 'Right behind the SCAN mark.' },
  { at: 0.42, t: 'LCD 16×2',       s: 'Two lines of status.' },
  { at: 0.56, t: 'Power and wires', s: 'A 9 V backup battery and the wiring.' },
  { at: 0.74, t: 'The SCAN panel', s: 'The face closes over everything.' },
  { at: 0.88, t: 'Switch it on',   s: 'Try the switch yourself.' },
];
const HOW_STEPS = [
  { t: 'The driver taps a card.',             lcd1: 'WAITING',     lcd2: 'TAP CARD' },
  { t: 'The shipment shows on the screen.',  lcd1: 'MATCH FOUND', lcd2: 'APPROVE?' },
  { t: 'The worker approves it.',             lcd1: 'APPROVED',    lcd2: 'WELCOME', state: 'approved' },
];

function storyEase(t){ t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }

function Story(){
  const ref = React.useRef(null);
  const panels = React.useRef([]);
  const fog = React.useRef(null);
  const [buildStep, setBuildStep] = React.useState(0);
  const [howStep, setHowStep] = React.useState(0);

  React.useEffect(() => {
    let raf = 0, alive = true, lastB = -1, lastH = -1, heroO = '', heroBg = null, heroTextBottom = 0;
    const starts = []; STORY.reduce((a, c, i) => { starts[i] = a; return a + c.len; }, 0);

    // the sticky nav takes its own height at the top of the page; pull the story up under it
    // so the first screen is centred in the whole window, not below the nav
    const tuck = () => {
      const el = ref.current; if (!el) return;
      el.style.marginTop = '0px';
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > 0 && top < 200) el.style.marginTop = (-top) + 'px';
      const hp = panels.current[0];                       // where the hero text ends (phones keep the device below it)
      if (hp) heroTextBottom = hp.offsetTop + hp.offsetHeight;
    };
    tuck(); window.addEventListener('resize', tuck);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tuck);   // the text height changes once the fonts load

    const frame = () => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const el = ref.current; if (!el) return;
      const vw = innerWidth, vh = innerHeight;
      const r = el.getBoundingClientRect();
      // U = the sticky screen height; S = the scroll distance of one chapter unit (shorter on phones, 24.11.2026)
      const sticky = el.firstElementChild && el.querySelector('.story-sticky');
      const U = sticky ? sticky.offsetHeight : r.height / (STORY_RUN + 1);
      const S = Math.max(1, (r.height - U) / STORY_RUN);
      const pos = -r.top / S;                              // scroll position in chapter units
      const wide = vw >= 900;

      // ---- the device: hold inside a chapter, glide between chapters ----
      const DH = 0.69;                                     // on-screen device height per unit of size (measured)
      const placeOf = (c) => {
        if (c.hero){
          if (wide){
            const size = Math.min(c.size * U, c.maxw * vw), h = size * DH;
            return { cx: c.cxw * vw, cy: U - (c.show - 0.5) * h, size };
          }
          const size = Math.min(c.mob.size * U, c.mob.maxw * vw), h = size * DH;
          // phones: the device sits at the bottom, its base cut off by the screen edge;
          // the text is anchored just above it (see heroDevTop below)
          const hm = size * c.mob.dh;
          return { cx: 0.5 * vw, cy: U - (c.mob.show - 0.5) * hm, size, top: U - c.mob.show * hm };
        }
        return wide
          ? { cx: (c.cxw || (c.dev === 'r' ? 0.7 : 0.3)) * vw, cy: (c.cy || 0.52) * U, size: Math.min(c.size * U, (c.maxw || 0.44) * vw) }
          : { cx: 0.5 * vw, cy: 0.3 * U, size: Math.min(c.size * 0.64 * U, 0.9 * vw) };
      };
      let i = 0; for (let k = 0; k < STORY.length; k++) if (pos >= starts[k]) i = k;
      const c = STORY[i], u = pos - starts[i];
      let A = placeOf(c), cfg = c, B = null, m = 0;
      // phones: keep the hero text right above the device, never on it
      if (!wide && STORY[0].mob){
        const hp = panels.current[0], h0 = placeOf(STORY[0]);
        const b = Math.round(U - h0.top + 20) + 'px';
        if (hp && hp.__b !== b){ hp.__b = b; hp.style.bottom = b; }
      } else if (panels.current[0] && panels.current[0].__b){ panels.current[0].__b = ''; panels.current[0].style.bottom = ''; }
      const G = 0.2;                                       // half of the glide between two chapters
      if (u > c.len - G && i < STORY.length - 1){ B = STORY[i + 1]; m = storyEase((u - (c.len - G)) / (2 * G)); }
      else if (u < G && i > 0){ B = STORY[i - 1]; m = storyEase((G - u) / (2 * G)); }
      let P = A, yaw = c.yaw, pitch = c.pitch, roll = c.roll || 0;
      if (B){
        const Bp = placeOf(B);
        P = { cx: A.cx + (Bp.cx - A.cx) * m, cy: A.cy + (Bp.cy - A.cy) * m, size: A.size + (Bp.size - A.size) * m };
        yaw = c.yaw + (B.yaw - c.yaw) * m; pitch = c.pitch + (B.pitch - c.pitch) * m; roll = (c.roll || 0) + ((B.roll || 0) - (c.roll || 0)) * m;
        if (m > 0.5) cfg = B;
      }
      // after the last chapter the stage scrolls away and the device goes with it
      const over = Math.max(0, pos - STORY_RUN) * S;

      // build progress and the "how it works" step
      const bi = STORY.findIndex(s => s.build);
      const bp = Math.max(0, Math.min(1, (pos - starts[bi] - 0.12) / (STORY[bi].len - 0.36)));
      const hi = STORY.findIndex(s => s.id === 'how');
      const hp = Math.max(0, Math.min(0.999, (pos - starts[hi] - 0.2) / (STORY[hi].len - 0.4)));
      const hs = Math.floor(hp * HOW_STEPS.length);
      let b = 0; BUILD_STEPS.forEach((s, k) => { if (bp >= s.at) b = k; });
      if (b !== lastB){ lastB = b; setBuildStep(b); }
      if (hs !== lastH){ lastH = hs; setHowStep(hs); }

      const how = cfg.id === 'how' ? HOW_STEPS[hs] : null;
      window.__vgTarget = {
        active: r.bottom > 0 && r.top < vh,
        key: cfg.id,
        cx: P.cx, cy: P.cy - over + Math.max(0, r.top), size: P.size,
        yaw, pitch, roll, spin: cfg.spin || 0, sway: cfg.sway, floor: cfg.floor || 0,
        build: cfg.build ? bp : -1,
        lcd1: how ? how.lcd1 : cfg.lcd1, lcd2: how ? how.lcd2 : cfg.lcd2, state: how ? (how.state || 'idle') : cfg.state,
        power: 1,
        wantBird: pos > 2.5,
      };

      // ---- the text: fade and rise in, fade out before the next chapter ----
      STORY.forEach((s, k) => {
        const p = panels.current[k]; if (!p) return;
        const lu = pos - starts[k];
        const vin = k === 0 ? 1 : storyEase((lu - 0.06) / 0.16);
        const vout = k === STORY.length - 1 ? 1 : 1 - storyEase((lu - (s.len - 0.24)) / 0.16);
        const v = Math.min(vin, vout);
        const y = (1 - vin) * 36 - (1 - vout) * 36;
        const o = v.toFixed(3);
        // the hero has its own background (navy, grid, light haze); it leaves with the hero text
        if (k === 0 && heroO !== o){
          heroO = o;
          const bg = heroBg || (heroBg = document.querySelector('.hero-bg'));
          if (bg){ bg.style.opacity = o; bg.style.visibility = v > 0.001 ? 'visible' : 'hidden'; }
          if (fog.current){ fog.current.style.opacity = o; }
        }
        if (p.__o !== o){ p.__o = o; p.style.opacity = o; p.style.visibility = v > 0.001 ? 'visible' : 'hidden'; }
        const tf = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
        if (p.__tf !== tf){ p.__tf = tf; p.style.transform = tf; }   // write only when it changes
      });
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', tuck); window.__vgTarget = null; };
  }, []);

  const P = (i) => (el) => { panels.current[i] = el; };
  const side = (c) => 'st-panel ' + (c.dev === 'r' ? 'at-l' : 'at-r');
  // anchors, so the nav can jump to a chapter
  let acc = 0;
  const anchors = STORY.map((c) => { const top = acc; acc += c.len; return { id: c.id === 'product' ? null : c.id, top: top + (c.id === 'product' ? 0 : 0.45) }; });

  return (
    <section ref={ref} className="story" id="product" style={{ '--run': STORY_RUN }} aria-label="VeriGate">
      {anchors.filter(a => a.id).map(a => <span key={a.id} id={a.id} className="st-anchor" style={{ top: 'calc(' + a.top + ' * var(--step))' }}></span>)}
      <div className="story-sticky">
        {/* the light haze the hero device stands in; it sits over the 3D canvas, under the text */}
        <div className="st-fog" ref={fog} aria-hidden="true"></div>
        <div className={side(STORY[0]) + ' st-hero'} ref={P(0)}>
          {/* 24.11.2026 (Osama): just the name and one catch phrase */}
          <h1 className="st-h1 st-brand">VeriGate</h1>
          <p className="st-catch"><em>Verified instantly.</em></p>
          <div className="st-cta">
            <a href="#process" className="btn primary big">
              See it work
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>
            </a>
          </div>
        </div>

        <div className={side(STORY[1])} ref={P(1)}>
          <h2 className="st-h2">Built <em>piece by piece</em>.</h2>
          <div className="st-build" aria-live="polite">
            <span className="st-count">{buildStep + 1} / {BUILD_STEPS.length}</span>
            <b>{BUILD_STEPS[buildStep].t}</b>
            <span>{BUILD_STEPS[buildStep].s}</span>
          </div>
          <span className="st-bar" aria-hidden="true"><i style={{ transform: 'scaleX(' + ((buildStep + 1) / BUILD_STEPS.length) + ')' }}></i></span>
        </div>

        <div className={side(STORY[2])} ref={P(2)}>
          <h2 className="st-h2">Receiving runs on <em>faith</em>.</h2>
          <ul className="st-list">
            <li>Paper at the gate.</li>
            <li>Data typed twice.</li>
            <li>No single source of truth.</li>
          </ul>
        </div>

        <div className={side(STORY[3])} ref={P(3)}>
          <h2 className="st-h2">One tap <em>closes the loop</em>.</h2>
          <ol className="st-steps">
            {HOW_STEPS.map((s, k) => <li key={k} className={k === howStep ? 'on' : ''}><span>{k + 1}</span>{s.t}</li>)}
          </ol>
        </div>

        <div className={side(STORY[4])} ref={P(4)}>
          <h2 className="st-h2">Built for the gate, <em>not the office</em>.</h2>
          <dl className="st-stats">
            <div><dt>&lt; 200 ms</dt><dd>from tap to screen</dd></div>
            <div><dt>13.56 MHz</dt><dd>RFID reader</dd></div>
            <div><dt>1 tap</dt><dd>per shipment</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}

window.Story = Story;
