/* Story: the top of the page as one pinned screen (23.11.2026).
   The page scrolls past a sticky stage. Each chapter is a short piece of text
   on one side; the page-wide 3D device (DeviceTour) sits on the other side.
   Everything is a pure function of the scroll position, so the device moves
   exactly as far as you scroll: it holds still while you read a chapter and
   glides to its next place between chapters.
   Every frame this writes window.__vgTarget for DeviceTour. */

const STORY = [
  { id: 'product', len: 0.6,  dev: 'r', yaw: -0.5,  pitch: 0.2,  size: 0.7,  spin: 1, floor: 1, cy: 0.53 },
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
  const [buildStep, setBuildStep] = React.useState(0);
  const [howStep, setHowStep] = React.useState(0);

  React.useEffect(() => {
    let raf = 0, alive = true, lastB = -1, lastH = -1;
    const starts = []; STORY.reduce((a, c, i) => { starts[i] = a; return a + c.len; }, 0);

    // the sticky nav takes its own height at the top of the page; pull the story up under it
    // so the first screen is centred in the whole window, not below the nav
    const tuck = () => {
      const el = ref.current; if (!el) return;
      el.style.marginTop = '0px';
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top > 0 && top < 200) el.style.marginTop = (-top) + 'px';
    };
    tuck(); window.addEventListener('resize', tuck);

    const frame = () => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const el = ref.current; if (!el) return;
      const vw = innerWidth, vh = innerHeight;
      const r = el.getBoundingClientRect();
      const U = r.height / (STORY_RUN + 1);              // one chapter unit, in px (= the sticky screen height)
      const pos = -r.top / U;                              // scroll position in chapter units
      const wide = vw >= 900;

      // ---- the device: hold inside a chapter, glide between chapters ----
      const placeOf = (c) => wide
        ? { cx: (c.dev === 'r' ? 0.7 : 0.3) * vw, cy: (c.cy || 0.52) * U, size: Math.min(c.size * U, 0.44 * vw) }
        : { cx: 0.5 * vw, cy: 0.3 * U, size: Math.min(c.size * 0.64 * U, 0.9 * vw) };
      let i = 0; for (let k = 0; k < STORY.length; k++) if (pos >= starts[k]) i = k;
      const c = STORY[i], u = pos - starts[i];
      let A = placeOf(c), cfg = c, B = null, m = 0;
      const G = 0.2;                                       // half of the glide between two chapters
      if (u > c.len - G && i < STORY.length - 1){ B = STORY[i + 1]; m = storyEase((u - (c.len - G)) / (2 * G)); }
      else if (u < G && i > 0){ B = STORY[i - 1]; m = storyEase((G - u) / (2 * G)); }
      let P = A, yaw = c.yaw, pitch = c.pitch;
      if (B){
        const Bp = placeOf(B);
        P = { cx: A.cx + (Bp.cx - A.cx) * m, cy: A.cy + (Bp.cy - A.cy) * m, size: A.size + (Bp.size - A.size) * m };
        yaw = c.yaw + (B.yaw - c.yaw) * m; pitch = c.pitch + (B.pitch - c.pitch) * m;
        if (m > 0.5) cfg = B;
      }
      // after the last chapter the stage scrolls away and the device goes with it
      const over = Math.max(0, pos - STORY_RUN) * U;

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
        yaw, pitch, spin: cfg.spin || 0, floor: cfg.floor || 0,
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
        if (p.__o !== o){ p.__o = o; p.style.opacity = o; p.style.visibility = v > 0.001 ? 'visible' : 'hidden'; }
        p.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
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
    <section ref={ref} className="story" id="product" style={{ '--run': STORY_RUN + 1 }} aria-label="VeriGate">
      {anchors.filter(a => a.id).map(a => <span key={a.id} id={a.id} className="st-anchor" style={{ top: 'calc(' + a.top + ' * var(--unit))' }}></span>)}
      <div className="story-sticky">
        <div className={side(STORY[0]) + ' st-hero'} ref={P(0)}>
          <h1 className="st-h1">A receiving device,<br /><em>verified instantly.</em></h1>
          <p className="st-lede">The driver taps a card. The shipment shows on the screen. The worker approves it.</p>
          <div className="st-cta">
            <a href="https://www.linkedin.com/in/osamasunaallah/" target="_blank" rel="noopener noreferrer" className="btn primary big">Connect on LinkedIn</a>
            <a href="#process" className="btn ghost big">See it work</a>
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
