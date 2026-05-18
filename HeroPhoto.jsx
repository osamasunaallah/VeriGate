/* HeroPhoto v3 — final layout
   ============================================================
   · Uses the new 3D-rendered device (product-hero-3d.png).
   · Centered vertical layout: eyebrow → headline → DEVICE (big,
     centered) → lede → CTAs → chapter dots. The headline sits
     ABOVE the device with safe spacing so it never disappears
     behind the visual.
   · Scroll-driven storytelling: 300vh outer + 100vh sticky stage.
     A continuous scroll progress `--t` (0..1) drives every motion.
   · LCD overlay re-calibrated for the new 3D render geometry
     (16.5% / 20.5% / 24% / 5%, near-zero skew).
   · Animations:
       - Device drop-in with a 3D power-on rotation
       - Halo conic + sonar rings react to scroll
       - Headline word-rise on chapter change
       - Continuous LCD blue→green crossfade
       - Subtle parallax: device lifts + tilts based on scroll
       - Scroll-spy chapter index
*/

const HERO_CHAPTERS = [
  {
    eyebrow: 'One tap. One verified shipment.',
    headlineA: 'A receiving device,',
    headlineB: 'verified instantly.',
    accent: 'verified instantly.',
    body: 'The driver taps an RFID card. The device pulls the matching shipment from the dashboard, shows it on the LCD, and lets the worker approve it in seconds.',
    lcdLine1: 'VERIGATE',
    lcdLine2: 'READY · SCAN',
    state: 'idle',
    statusLabel: 'STATUS · IDLE',
    chip: 'CHAPTER 01',
  },
  {
    eyebrow: 'Inside the enclosure',
    headlineA: 'Built around an Arduino,',
    headlineB: 'a 13.56 MHz reader.',
    accent: 'an Arduino,',
    body: 'A matte-black ABS shell. A 16×2 LCD set behind anti-glare glass. The reader sits flush behind the SCAN panel — no antenna, no housing seams, no cable spaghetti.',
    lcdLine1: 'WAITING',
    lcdLine2: 'TAP CARD',
    state: 'idle',
    statusLabel: 'STATUS · LISTENING',
    chip: 'CHAPTER 02',
  },
  {
    eyebrow: 'Tap. Verified. Welcome.',
    headlineA: 'Approved',
    headlineB: 'in seconds.',
    accent: 'in seconds.',
    body: 'A single rocker switch. A 9V backup cell tucked behind. The driver taps, the device confirms — green light, gate open, the whole shipment in your ledger.',
    lcdLine1: 'APPROVED',
    lcdLine2: 'WELCOME',
    state: 'approved',
    statusLabel: 'STATUS · GRANTED',
    chip: 'CHAPTER 03',
  },
];

/* ============================================================
   useStatusSource(setActive, chapterCount)
   ------------------------------------------------------------
   The SINGLE point of control for the hero status. Today it
   demo-cycles through chapters every 2 s. To wire it to a real
   data source, replace the body with one of the recipes below
   — nothing else in the file needs to change.

   FIELD CONTROLLING THE STATUS:
     `activeChapter` (0..HERO_CHAPTERS.length-1), set via React's
     `setActive`. Each chapter contains `state: 'idle'|'approved'`,
     `lcdLine1`, `lcdLine2`, `eyebrow`, `headlineA`, `headlineB`, ...

   ───────────  RECIPE A — Firebase Realtime Database  ───────────
     import { getDatabase, ref, onValue, off } from 'firebase/database';
     React.useEffect(() => {
       const db = getDatabase();
       const r = ref(db, 'devices/VG-04/status');   // your path
       const unsub = onValue(r, (snap) => {
         const s = snap.val();                       // e.g. {chapter: 2}
         if (s && typeof s.chapter === 'number'){
           setActive(Math.max(0, Math.min(chapterCount - 1, s.chapter)));
         }
       });
       return () => off(r, 'value', unsub);          // cleanup on unmount
     }, [setActive, chapterCount]);

   ───────────  RECIPE B — Firestore  ────────────────────────────
     import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
     React.useEffect(() => {
       const db = getFirestore();
       const docRef = doc(db, 'devices', 'VG-04');
       const unsub = onSnapshot(docRef, (snap) => {
         const s = snap.data();
         if (s && typeof s.chapter === 'number'){
           setActive(Math.max(0, Math.min(chapterCount - 1, s.chapter)));
         }
       });
       return () => unsub();
     }, [setActive, chapterCount]);

   ───────────  RECIPE C — Polling a REST endpoint  ──────────────
     React.useEffect(() => {
       let alive = true;
       const tick = async () => {
         try {
           const r = await fetch('/api/devices/VG-04/status');
           const s = await r.json();
           if (alive && typeof s.chapter === 'number'){
             setActive(s.chapter);
           }
         } catch(_){}
       };
       tick();
       const id = setInterval(tick, 2000);           // 2 s poll
       return () => { alive = false; clearInterval(id); };
     }, [setActive, chapterCount]);

   ───────────  RECIPE D — WebSocket / SSE from Arduino bridge  ──
     React.useEffect(() => {
       const ws = new WebSocket('wss://your-bridge.example/devices/VG-04');
       ws.onmessage = (e) => {
         try {
           const msg = JSON.parse(e.data);
           if (typeof msg.chapter === 'number') setActive(msg.chapter);
         } catch(_){}
       };
       return () => ws.close();
     }, [setActive, chapterCount]);

   CURRENT IMPLEMENTATION = demo cycle (no backend).
   ============================================================ */
function useStatusSource(setActive, chapterCount){
  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((cur) => (cur + 1) % chapterCount);
    }, 2000);
    return () => clearInterval(id);
  }, [setActive, chapterCount]);
}

function HeadlineWords({ text, accent }){
  if (!text) return null;
  const words = text.split(' ');
  return words.map((w, i) => {
    const cleanW = w.replace(/[.,;:!?]+$/, '');
    const cleanAccent = accent?.replace(/[.,;:!?]+$/, '');
    const isAccentWord = cleanAccent && cleanAccent.toLowerCase().includes(cleanW.toLowerCase()) && cleanW.length > 2;
    return (
      <span key={i + '-' + w} className="hp-word" style={{ '--i': i }}>
        <span className={'hp-word-inner' + (isAccentWord ? ' is-accent' : '')}>
          {w}
        </span>
      </span>
    );
  });
}

function HeroPhoto(){
  const sectionRef = React.useRef(null);
  const deviceRef = React.useRef(null);
  const stageRef  = React.useRef(null);
  const [active, setActive] = React.useState(0);

  /* Wire up the status source. `useStatusSource` is the single point of
     control — swap its body to connect to Firebase / a REST API / Arduino
     telemetry. See the hook definition below for the integration recipes. */
  useStatusSource(setActive, HERO_CHAPTERS.length);

  /* Drive the LCD blue→green --blend var directly from active chapter */
  React.useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    const isApproved = HERO_CHAPTERS[active].state === 'approved';
    sec.style.setProperty('--blend', isApproved ? '1' : '0');
  }, [active]);

  const chap = HERO_CHAPTERS[active];
  const isApproved = chap.state === 'approved';

  return (
    <section
      ref={sectionRef}
      className={'hp' + (isApproved ? ' is-approved' : '')}
      id="product"
    >
      <div className="hp-stick">

        {/* Animated halo backdrop behind the whole stage */}
        <div className="hp-bg" aria-hidden="true">
          <div className="hp-bg-orb hp-bg-orb-a"></div>
          <div className="hp-bg-orb hp-bg-orb-b"></div>
          <div className="hp-bg-grid"></div>
        </div>

        <div className="hp-shell">

          {/* TOP: eyebrow + headline + lede */}
          <header className="hp-head">
            <div className="hp-eyebrow" key={'eyebrow-' + active}>
              <span className="hp-eyebrow-dot"></span>
              <span className="hp-eyebrow-text">{chap.eyebrow}</span>
              <span className="hp-eyebrow-pill">{chap.chip}</span>
            </div>

            <h1 className="hp-headline" key={'headline-' + active}>
              <span className="hp-headline-line">
                <HeadlineWords text={chap.headlineA} accent={chap.accent} />
              </span>
              <span className="hp-headline-line">
                <HeadlineWords text={chap.headlineB} accent={chap.accent} />
              </span>
            </h1>

            <p className="hp-lede" key={'lede-' + active}>{chap.body}</p>
          </header>

          {/* MIDDLE: centered device with halo + LCD overlay */}
          <div ref={stageRef} className="hp-stage" aria-hidden="false">
            <div className="hp-halo" aria-hidden="true">
              <div className="hp-halo-conic"></div>
              <div className="hp-halo-bloom"></div>
            </div>

            <div className="hp-device-wrap">
              {/* 3D model — the LCD is part of the GLB mesh, painted via
                  CanvasTexture, so it rotates and scales WITH the device. */}
              <DeviceWithLCD
                activeChapter={active}
                chapters={HERO_CHAPTERS}
                className="hp-device-3d"
              />
              {/* Floor shadow that scales with scroll */}
              <div className="hp-floor-shadow" aria-hidden="true"></div>
            </div>

            {/* Floating telemetry chips — pinned safely to the sides of the stage */}
            <div className="hp-chip hp-chip-left">
              <span className="hp-chip-tag">UNIT</span>
              <span className="hp-chip-val">VG-04 · Gate</span>
            </div>
            <div className="hp-chip hp-chip-right" key={'status-' + active}>
              <span className="hp-chip-bar"></span>
              <span className="hp-chip-val">{chap.statusLabel}</span>
            </div>
          </div>

          {/* BOTTOM: CTAs + chapter dots */}
          <footer className="hp-foot">
            <div className="hp-cta-row">
              <a
                href="https://www.linkedin.com/in/osamasunaallah/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn primary big"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"/></svg>
                Connect on LinkedIn
                <svg className="hp-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#process" className="btn ghost big">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                See it work
              </a>
            </div>

            <div className="hp-dots" role="tablist" aria-label="Hero chapters">
              {HERO_CHAPTERS.map((c, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === active}
                  className={'hp-dot' + (i === active ? ' on' : '') + (i < active ? ' done' : '')}
                  onClick={() => {
                    setActive(i);
                    const isMobile = window.matchMedia('(max-width: 1020px)').matches;
                    if (!isMobile && sectionRef.current) {
                      const rect = sectionRef.current.getBoundingClientRect();
                      const targetT = i / (HERO_CHAPTERS.length - 1);
                      const total = rect.height - window.innerHeight;
                      const scrollTo = rect.top + window.scrollY + (targetT * total);
                      window.scrollTo({ top: scrollTo, behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="hp-dot-ring"></span>
                  <span className="hp-dot-num">0{i + 1}</span>
                </button>
              ))}
            </div>
          </footer>

        </div>
      </div>

      <style>{`
        /* ===========================================================
           HERO — 300vh outer + 100vh sticky inner on desktop.
           On mobile, outer is auto-height (no sticky).
           =========================================================== */
        .hp{
          position: relative;
          width: 100%;
          /* Single-viewport hero — no sticky scroll, no scroll listener.
             Auto-cycling chapter swap handles the LCD changes (every
             2.4s). Section has a bottom-safe margin so it never overlaps
             the marquee/architecture below. */
          min-height: 100vh;
          padding-bottom: clamp(40px, 6vh, 80px);
          --t: 0;
          --blend: 0;
        }
        .hp-stick{
          /* Renamed semantically but no longer sticky — kept the class for
             style continuity. Just a flex container that centers content. */
          position: relative;
          min-height: calc(100vh - 40px);
          overflow: hidden;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===========================================================
           BACKGROUND — soft violet bloom + sonar rings + grid
           =========================================================== */
        .hp-bg{ position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .hp-bg-orb{
          position: absolute;
          width: 820px; height: 820px;
          border-radius: 50%;
          filter: blur(90px);
          mix-blend-mode: screen;
          opacity: .72;
          will-change: transform;
          transition: transform .9s var(--easing);
        }
        /* PARALLAX LAYER A — drifts LEFT and UP as you scroll */
        .hp-bg-orb-a{
          left: 50%; top: 50%;
          transform: translate3d(
            calc(-55% + var(--t) * -90px),
            calc(-45% + var(--t) * -40px),
            0
          ) scale(calc(1 + var(--t) * .08));
          background: radial-gradient(circle, rgba(124,138,255,.45), transparent 70%);
        }
        /* PARALLAX LAYER B — drifts RIGHT and DOWN (opposite of A) */
        .hp-bg-orb-b{
          left: 50%; top: 50%;
          transform: translate3d(
            calc(-45% + var(--t) * 100px),
            calc(-55% + var(--t) * 40px),
            0
          ) scale(calc(1 + var(--t) * .06));
          background: radial-gradient(circle, rgba(167,139,250,.40), transparent 70%);
        }
        .hp.is-approved .hp-bg-orb-b{
          background: radial-gradient(circle, rgba(126,227,181,.40), transparent 70%);
        }

        /* PARALLAX LAYER C — grid drifts vertically with scroll, slowest layer */
        .hp-bg-grid{
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(167,139,250,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,.05) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 25%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 25%, transparent 80%);
          transform: translate3d(0, calc(var(--t) * -60px), 0);
          transition: transform .9s var(--easing);
        }
        /* ===========================================================
           SHELL — vertical stack inside the 100vh sticky
           =========================================================== */
        .hp-shell{
          position: relative;
          z-index: 1;
          width: min(1280px, calc(100% - 32px));
          height: 100%;
          padding: clamp(90px, 11vh, 130px) 0 clamp(24px, 4vh, 48px);
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: clamp(8px, 1.5vh, 18px);
          text-align: center;
          align-items: center;
        }

        /* ===========================================================
           HEAD — eyebrow chip + huge headline + lede
           =========================================================== */
        .hp-head{
          display: flex; flex-direction: column;
          gap: clamp(12px, 1.5vh, 20px);
          align-items: center;
          z-index: 3;
        }
        .hp-eyebrow{
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 14px 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255,255,255,.04);
          backdrop-filter: blur(10px);
          font: 500 11.5px/1 var(--font-mono);
          letter-spacing: .2em; text-transform: uppercase;
          color: var(--muted);
          animation: hpFade .6s var(--easing-out) both;
        }
        .hp-eyebrow-dot{
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 4px rgba(124,138,255,.16), 0 0 12px rgba(124,138,255,.7);
          animation: hpDotPulse 2.4s ease-in-out infinite;
        }
        .hp.is-approved .hp-eyebrow-dot{
          background: var(--ok);
          box-shadow: 0 0 0 4px rgba(126,227,181,.16), 0 0 12px rgba(126,227,181,.7);
        }
        @keyframes hpDotPulse{ 50%{ box-shadow: 0 0 0 8px rgba(124,138,255,.05), 0 0 18px rgba(124,138,255,.9); } }
        .hp-eyebrow-text{ color: var(--text); }
        .hp-eyebrow-pill{
          margin-left: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(167,139,250,.10);
          color: var(--accent-2);
          font-size: 10.5px;
        }
        .hp.is-approved .hp-eyebrow-pill{
          border-color: var(--line-ok);
          background: rgba(126,227,181,.10);
          color: var(--ok);
        }

        .hp-headline{
          margin: 0;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(34px, 5.4vw, 72px);
          line-height: .98;
          letter-spacing: -0.035em;
          color: var(--text);
          text-wrap: balance;
          display: flex; flex-direction: column;
          gap: 0.02em;
          align-items: center;
        }
        .hp-headline-line{ display: flex; flex-wrap: wrap; gap: 0 0.22em; justify-content: center; }
        .hp-word{
          display: inline-block;
          overflow: hidden;
          padding-bottom: 0.08em;
          line-height: 1.04;
        }
        .hp-word-inner{
          display: inline-block;
          transform: translateY(112%);
          opacity: 0;
          /* Tightened for the 2s auto-cycle: 0.65s duration + 40ms per-word
             stagger means even the longest headline (4 words) completes in
             ~0.85s, well inside the 2s rhythm. */
          animation: hpWordRise .65s cubic-bezier(.2,.85,.25,1) both;
          animation-delay: calc(var(--i, 0) * 40ms + 60ms);
        }
        @keyframes hpWordRise{
          0%   { transform: translateY(112%); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .hp-word-inner.is-accent{
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 400;
          font-size: 1.04em;
          letter-spacing: -0.022em;
          background: linear-gradient(180deg, #FFFFFF 0%, #C5CAF8 50%, var(--accent-2) 100%);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
          transition: background .8s var(--easing);
        }
        .hp.is-approved .hp-word-inner.is-accent{
          background: linear-gradient(180deg, #FFFFFF 0%, #C8F5DA 50%, var(--ok) 100%);
          -webkit-background-clip: text; background-clip: text;
        }

        .hp-lede{
          margin: 0 auto;
          max-width: 60ch;
          font-size: clamp(14.5px, 1.05vw, 17px);
          line-height: 1.6;
          color: var(--text-2);
          animation: hpFadeUp .6s var(--easing-out) both;
        }

        /* ===========================================================
           STAGE — centered device + halo + telemetry chips
           =========================================================== */
        .hp-stage{
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1600px;
          z-index: 1;
        }
        .hp-halo{
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: clamp(360px, 38vw, 600px);
          aspect-ratio: 1;
          pointer-events: none;
          z-index: 0;
        }
        /* Static violet bloom instead of a perpetually-spinning conic gradient
           — same look at a fraction of the GPU cost, no scroll lag. */
        .hp-halo-conic{
          position: absolute; inset: 0;
          border-radius: 50%;
          background:
            radial-gradient(closest-side at 35% 50%, rgba(124,138,255,.35), transparent 65%),
            radial-gradient(closest-side at 65% 50%, rgba(167,139,250,.30), transparent 65%);
          filter: blur(40px);
          opacity: calc(.65 + var(--t) * .15);
          transition: opacity .8s var(--easing);
        }
        .hp.is-approved .hp-halo-conic{
          background:
            radial-gradient(closest-side at 35% 50%, rgba(126,227,181,.35), transparent 65%),
            radial-gradient(closest-side at 65% 50%, rgba(176,242,210,.30), transparent 65%);
        }
        .hp-halo-bloom{
          position: absolute;
          inset: 16%;
          border-radius: 50%;
          background: radial-gradient(closest-side, rgba(167,139,250,.30), transparent 70%);
          filter: blur(30px);
          animation: hpHaloBreathe 5.5s ease-in-out infinite;
        }
        .hp.is-approved .hp-halo-bloom{
          background: radial-gradient(closest-side, rgba(126,227,181,.30), transparent 70%);
        }
        @keyframes hpHaloBreathe{
          0%, 100%{ opacity: .8; transform: scale(1); }
          50%     { opacity: 1; transform: scale(1.06); }
        }

        .hp-device-wrap{
          position: relative;
          z-index: 1;
          display: flex; align-items: center; justify-content: center;
          /* LARGER on desktop, still clamped so it never overflows a
             smaller viewport's shorter dimension. 60vmin / 60vh / 720px
             gives a commanding hero without crowding the headline above
             or the CTAs below. */
          width: min(60vmin, 60vh, 720px);
          aspect-ratio: 1 / 1;
        }
        .hp-device-3d{
          width: 100%;
          height: 100%;
        }
        /* TWO LAYERS for the device:
           - .hp-device-anim handles the perpetual idle motion in its OWN
             transform — a slow float-bob + a gentle showcase yaw so the
             device feels alive even when nobody's touching it.
           - .hp-device handles scroll, cursor, and drag rotations.
           They compose multiplicatively (parent × child) so there is no
           conflict and no transition needed on the child — every scroll
           frame paints instantly. */
        .hp-device-anim{
          display: inline-block;
          transform-style: preserve-3d;
          animation: hpDeviceShowcase 9s ease-in-out 1.4s infinite;
          will-change: transform;
        }
        @keyframes hpDeviceShowcase{
          0%   { transform: translateY(0)   rotateY(-6deg) rotateX(0deg); }
          25%  { transform: translateY(-6px) rotateY( 0deg) rotateX(-1deg); }
          50%  { transform: translateY(-2px) rotateY( 8deg) rotateX(0deg); }
          75%  { transform: translateY(-6px) rotateY( 0deg) rotateX(-1deg); }
          100% { transform: translateY(0)   rotateY(-6deg) rotateX(0deg); }
        }
        .hp-device{
          position: relative;
          /* RESPONSIVE SIZING — bigger and more dominant on desktop,
             still fits on mobile. Width scales with viewport's shorter
             dimension so it never overflows. */
          width: min(48vmin, 56vh, 580px);
          transform-style: preserve-3d;
          touch-action: none;
          cursor: grab;
          /* Scroll + cursor + drag rotation vars, all summed into one
             transform. No CSS transition on transform — scroll is 1:1. */
          --tilt-x: 0deg;
          --tilt-y: 0deg;
          --drag-x: 0deg;
          --drag-y: 0deg;
          --scroll-y: calc(var(--t) * -22px);
          --scroll-rx: calc(var(--t) * 3deg);
          --scroll-ry: calc((var(--t) - 0.5) * -16deg);  /* ±8° swing */
          --scroll-s: calc(1 + var(--t) * .03);
          transform:
            translateY(var(--scroll-y))
            rotateX(calc(var(--scroll-rx) + var(--tilt-x) + var(--drag-x)))
            rotateY(calc(var(--scroll-ry) + var(--tilt-y) + var(--drag-y)))
            scale(var(--scroll-s));
          /* NO transition on transform — scroll is 1:1.
             Three stacked drop-shadows give the device weight: a tight
             contact shadow + a soft volumetric one + a violet glow. */
          filter:
            drop-shadow(0 30px 30px rgba(0,0,0,.55))
            drop-shadow(0 70px 60px rgba(0,0,0,.45))
            drop-shadow(0 0 60px rgba(124,138,255,.18));
          animation: hpDevicePowerOn 1.4s cubic-bezier(.2,.85,.25,1) .2s both;
          will-change: transform, filter;
        }
        .hp-device.is-dragging{ cursor: grabbing; }
        @keyframes hpDevicePowerOn{
          0%   { opacity: 0; transform: translateY(60px) rotateX(15deg) rotateY(-20deg) scale(.78); filter: blur(12px); }
          60%  { opacity: 1; }
          100% { opacity: 1; }
        }
        /* Glare highlight that swings with cursor — fake specular reflection */
        .hp-device::before{
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            220px 220px at
              calc(50% + var(--tilt-y, 0deg) * 1.4)
              calc(40% + var(--tilt-x, 0deg) * -1.4),
            rgba(255,255,255,.18),
            transparent 70%
          );
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 2;
          opacity: .55;
          transition: opacity .35s var(--easing);
        }
        .hp-stage:hover .hp-device::before{ opacity: .8; }
        /* FAKE-3D DEPTH SHADOW — a duplicated, blurred copy of the
           silhouette sits BEHIND the device and shifts opposite to the
           current rotation. Doesn't fix the paper-plane look at extreme
           angles but adds real depth weight at the small angles we use. */
        .hp-device::after{
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,.4);
          filter: blur(40px);
          z-index: -1;
          opacity: .55;
          transform: translateY(28px) scale(.9, .85);
          border-radius: 24px;
          pointer-events: none;
        }
        .hp-img{
          width: 100%; height: auto; display: block;
          user-select: none; -webkit-user-drag: none;
        }
        .hp-floor-shadow{
          position: absolute;
          left: 50%; bottom: -8%;
          transform: translateX(-50%) scaleY(calc(0.5 + var(--t) * 0.2));
          width: 70%; height: 22px;
          background: radial-gradient(closest-side, rgba(0,0,0,.55), transparent 70%);
          filter: blur(14px);
          z-index: -1;
        }

        /* ===========================================================
           LCD OVERLAY — covers full bezel (including the dark plastic
           frame around the glass) so it looks like one molded module
           with the device. Sized slightly LARGER than the glass-only
           detection (was 63→219 px wide × 118→169 px tall) to grab
           the bezel frame around it.
           Coordinates in cropped image (477×535):
             bezel: (50, 100)→(232, 184)  (px)
             pct:   10.48% / 18.69% / 38.16% / 15.70%
           No 2D transform → the overlay inherits the .hp-device's 3D
           rotation through the preserve-3d chain, so it foreshortens
           with perspective as the device sweeps.
           =========================================================== */
        .hp-lcd{
          position: absolute;
          /* Sized to MATCH the Blender model's actual LCD plane:
               49.14 mm × 9.72 mm → 5.06 : 1 aspect ratio (wide-and-thin
               16×2-character LCD module).
             Previous overlay was 32.70% × 14.39% = 2.27:1 (way too tall).
             New: 24% × 4.74% maintains the model's 5.06:1 aspect, and is
             ~30% smaller overall.
             Position: centered on the detected LCD-glass centroid in the
             cropped 477×535 render → (29.56%, 27.40%). */
          left: 17.56%;       /* 29.56% − 24%/2 */
          top: 25.03%;        /* 27.40% − 4.74%/2 */
          width: 24%;
          height: 4.74%;      /* 24% / 5.06 → maintains model aspect ratio */
          transform-origin: center center;
          pointer-events: none;
          z-index: 2;
          border-radius: 2px;
          /* Slight CCW tilt ("rotated to left") + small translateZ so it
             sits ON the device surface and inherits the parent's 3D
             rotation through preserve-3d. */
          transform: translateZ(1px) rotate(-3deg);
          transform-style: preserve-3d;
        }
        .hp-lcd-glass{
          position: absolute; inset: 0;
          background: radial-gradient(120% 90% at 50% 35%, #2A52BE 0%, #1f3f9e 30%, #142a72 65%, #0c1e5a 100%);
          border-radius: 1px;
          /* Glow strength scales with scroll progress so the LCD literally
             gets brighter as you progress through the story. */
          box-shadow:
            inset 0 0 0 1px rgba(0,0,0,.6),
            inset 0 1px 1px rgba(255,255,255,.08),
            inset 0 0 calc(12px + var(--t) * 8px) rgba(60,100,220, calc(.4 + var(--t) * .25)),
            0 0 calc(14px + var(--t) * 12px) rgba(40,80,200, calc(.35 + var(--t) * .25));
          overflow: hidden;
          transition: box-shadow .6s var(--easing);
        }
        .hp.is-approved .hp-lcd-glass{
          box-shadow:
            inset 0 0 0 1px rgba(0,0,0,.6),
            inset 0 1px 1px rgba(255,255,255,.10),
            inset 0 0 12px rgba(60,220,140,.45),
            0 0 18px rgba(40,200,120,.55);
        }
        .hp-lcd-green{
          position: absolute; inset: 0;
          background: radial-gradient(120% 90% at 50% 35%, #2DD279 0%, #1aa05a 30%, #0d6e3a 65%, #094a27 100%);
          opacity: var(--blend, 0);
          transition: opacity .6s var(--easing);
        }
        .hp-lcd-glass::after{
          content: ""; position: absolute;
          left: 0; right: 0; top: 0; height: 35%;
          background: linear-gradient(180deg, rgba(255,255,255,.10) 0%, transparent 100%);
          pointer-events: none; z-index: 3;
        }
        .hp-lcd-pixels{
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(0deg, rgba(255,255,255,.02) 0 1px, transparent 1px 5px),
            repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 1px, transparent 1px 5px);
          pointer-events: none; z-index: 1; opacity: .6;
        }
        .hp-lcd-layer{
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 1px; padding: 0 4%;
          opacity: 0;
          transform: translateY(40%);
          transition: opacity .55s var(--easing-out), transform .55s var(--easing-out);
          z-index: 2;
        }
        .hp-lcd-layer.on{ opacity: 1; transform: translateY(0); }
        .hp-lcd-l1, .hp-lcd-l2{
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          line-height: 1;
          letter-spacing: .06em;
          white-space: nowrap;
          text-align: center;
        }
        .hp-lcd-l1{
          font-size: clamp(7px, .82vw, 12px);
          color: #E0EBFF;
          text-shadow:
            0 0 2px rgba(255,255,255,.7),
            0 0 6px rgba(170,210,255,.85),
            0 0 12px rgba(91,140,255,.45);
          display: inline-flex; align-items: center; gap: 1px;
          transition: color .6s var(--easing), text-shadow .6s var(--easing);
        }
        .hp-lcd-l2{
          font-size: clamp(5.5px, .65vw, 9.5px);
          color: #B5CDFF;
          opacity: .95; font-weight: 600; letter-spacing: .08em;
          text-shadow:
            0 0 2px rgba(255,255,255,.5),
            0 0 6px rgba(149,182,240,.8);
          transition: color .6s var(--easing), text-shadow .6s var(--easing);
        }
        .hp.is-approved .hp-lcd-l1{
          color: #E8FFEF;
          text-shadow: 0 0 2px rgba(255,255,255,.7), 0 0 6px rgba(170,255,200,.85), 0 0 12px rgba(110,231,183,.5);
        }
        .hp.is-approved .hp-lcd-l2{
          color: #C8F5DA;
          text-shadow: 0 0 2px rgba(255,255,255,.5), 0 0 6px rgba(170,255,200,.75);
        }
        .hp-lcd-cursor{ display: inline-block; margin-left: 1px; animation: hpBlink 1s steps(2) infinite; }
        @keyframes hpBlink{ 50%{ opacity: 0; } }
        .hp-lcd-scan{
          position: absolute; left: 0; right: 0; height: 30%;
          background: linear-gradient(180deg, transparent, rgba(170,210,255,.4), transparent);
          /* Scan beam speed ramps from slow → fast as scroll progresses */
          animation: hpScan calc(3.6s - var(--t) * 2.4s) linear infinite;
          pointer-events: none; z-index: 1;
          opacity: calc(.7 + var(--t) * .3);
        }
        .hp.is-approved .hp-lcd-scan{
          background: linear-gradient(180deg, transparent, rgba(170,255,200,.28), transparent);
        }
        @keyframes hpScan{ 0%{ top: -30%; } 100%{ top: 110%; } }
        .hp-lcd-bloom{
          position: absolute; inset: -200% -40% -200% -40%;
          background: radial-gradient(closest-side, rgba(91,140,255,.18), transparent 75%);
          filter: blur(20px); pointer-events: none; z-index: -1;
          transition: background .6s var(--easing);
        }
        .hp.is-approved .hp-lcd-bloom{
          background: radial-gradient(closest-side, rgba(110,231,183,.22), transparent 75%);
        }

        /* ===========================================================
           TELEMETRY CHIPS — pinned to the stage edges, never overlap
           text because they sit outside the headline area.
           =========================================================== */
        .hp-chip{
          position: absolute;
          z-index: 3;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 14px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(20,23,43,.55);
          backdrop-filter: blur(10px);
          font: 600 10.5px/1 var(--font-mono);
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--text);
          animation: hpChipFloat 7s ease-in-out infinite;
        }
        .hp-chip-left{
          left: clamp(8px, 5vw, 80px);
          top: 50%;
          transform: translateY(-50%);
          animation-delay: -2s;
        }
        .hp-chip-right{
          right: clamp(8px, 5vw, 80px);
          top: 50%;
          transform: translateY(-50%);
        }
        .hp-chip-tag{ color: var(--muted-2); }
        .hp-chip-val{ color: var(--text); }
        .hp-chip-bar{
          width: 22px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-2));
        }
        .hp.is-approved .hp-chip-bar{ background: linear-gradient(90deg, transparent, var(--ok)); }
        .hp.is-approved .hp-chip-right{ color: var(--ok-2); border-color: var(--line-ok); }
        @keyframes hpChipFloat{
          0%, 100%{ transform: translateY(-50%) translateX(0); }
          50%     { transform: translateY(calc(-50% - 6px)) translateX(0); }
        }

        /* ===========================================================
           FOOT — CTAs + chapter dots
           =========================================================== */
        .hp-foot{
          display: flex; flex-direction: column;
          gap: 16px;
          align-items: center;
          z-index: 3;
        }
        .hp-cta-row{
          display: flex; gap: 12px; flex-wrap: wrap;
          justify-content: center; align-items: center;
        }
        .hp-cta-arrow{ transition: transform .35s var(--easing-spring); }
        .btn.primary:hover .hp-cta-arrow{ transform: translateX(4px); }

        .hp-dots{
          display: flex; gap: 22px;
          align-items: center;
        }
        .hp-dot{
          padding: 0; margin: 0; border: 0; background: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          font: 500 11px/1 var(--font-mono);
          letter-spacing: .22em;
          color: var(--muted-2);
          transition: color .35s var(--easing);
        }
        .hp-dot-ring{
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 1.5px solid var(--line-2);
          background: transparent;
          display: grid; place-items: center;
          transition: border-color .35s var(--easing), transform .35s var(--easing-spring), box-shadow .35s var(--easing);
        }
        .hp-dot-ring::after{
          content: "";
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--muted-2);
          transition: background .35s var(--easing), transform .35s var(--easing-spring);
        }
        .hp-dot.done .hp-dot-ring::after{ background: var(--accent); }
        .hp-dot.on{ color: var(--text); }
        .hp-dot.on .hp-dot-ring{
          border-color: var(--accent);
          transform: scale(1.12);
          box-shadow: 0 0 0 4px rgba(124,138,255,.10), 0 8px 20px rgba(124,138,255,.3);
        }
        .hp-dot.on .hp-dot-ring::after{
          background: var(--accent);
          transform: scale(1.2);
        }
        .hp.is-approved .hp-dot.on .hp-dot-ring{ border-color: var(--ok); box-shadow: 0 0 0 4px rgba(126,227,181,.10), 0 8px 20px rgba(126,227,181,.3); }
        .hp.is-approved .hp-dot.on .hp-dot-ring::after,
        .hp.is-approved .hp-dot.done .hp-dot-ring::after{ background: var(--ok); }
        .hp-dot:hover .hp-dot-ring{ border-color: var(--accent-2); }
        .hp-dot:focus-visible{ outline: 2px solid var(--accent-2); outline-offset: 4px; border-radius: 4px; }

        /* ===========================================================
           Misc keyframes
           =========================================================== */
        @keyframes hpFade{ from{ opacity: 0; } to{ opacity: 1; } }
        @keyframes hpFadeUp{ from{ opacity: 0; transform: translateY(12px); } to{ opacity: 1; transform: translateY(0); } }

        /* ===========================================================
           RESPONSIVE
           =========================================================== */
        @media (max-width: 1100px){
          .hp-chip-left{ left: 0; }
          .hp-chip-right{ right: 0; }
        }
        @media (max-width: 1020px){
          .hp{ min-height: auto; }
          .hp-stick{
            position: static;
            height: auto;
            min-height: auto;
            padding: 0;
          }
          .hp-shell{
            grid-template-rows: auto auto auto;
            height: auto;
            padding: clamp(80px, 12vh, 110px) 0 clamp(40px, 6vh, 60px);
            gap: clamp(20px, 3vh, 32px);
          }
          .hp-stage{ height: auto; min-height: 360px; perspective: none; padding: 16px 0; }
          .hp-halo{ width: min(88vw, 560px); }
          .hp-device-wrap{ width: min(78vw, 460px); aspect-ratio: 1 / 1; }
          .hp-chip{ display: none; }
        }
        @media (max-width: 640px){
          .hp-headline{ font-size: clamp(30px, 8.6vw, 44px); }
          .hp-eyebrow-text{ display: none; }
          .hp-eyebrow{ padding: 6px 10px; }
          .hp-device-wrap{ width: min(86vw, 360px); }
          .hp-lede{ font-size: 14px; max-width: 42ch; }
          .hp-dots{ gap: 14px; }
        }

        @media (prefers-reduced-motion: reduce){
          .hp-word-inner{ animation: none; transform: none; opacity: 1; }
          .hp-device, .hp-halo-conic, .hp-halo-bloom, .hp-bg-ring, .hp-chip{ animation: none; }
          .hp-lcd-cursor, .hp-lcd-scan{ animation: none; }
        }
      `}</style>
    </section>
  );
}

window.HeroPhoto = HeroPhoto;
