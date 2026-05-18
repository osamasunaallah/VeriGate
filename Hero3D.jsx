/* Hero3D — scroll-driven 3D device experience.
   The device sits in a sticky stage on the right.
   As the user scrolls through the hero section, the device rotates,
   scales, and the LCD text + screen color animate from a blue idle
   state into a green "approved" state.

   Driven by IntersectionObserver + scroll position math (no GSAP needed).
*/

const CHAPTERS = [
  {
    eyebrow: 'One tap. One verified shipment.',
    headline: <>A receiving device,<br/><em className="serif-italic grad-text">verified instantly</em>.</>,
    body: 'The driver taps an RFID card. The device pulls the matching shipment from the dashboard, shows it on the LCD, and lets the worker approve it in seconds.',
    rx: -8, ry: -28, rz: 0, scale: 1,
    lcdLine1: 'VERIGATE',
    lcdLine2: 'READY · SCAN',
    screenState: 'idle'
  },
  {
    eyebrow: 'Inside the enclosure',
    headline: <>Built around <em className="serif-italic grad-text">an Arduino</em> and a 13.56 MHz reader.</>,
    body: 'A matte black ABS shell. A 16×2 LCD set behind anti-glare glass. The reader sits flush behind the SCAN panel — no antenna, no housing seams, no cable spaghetti.',
    rx: 4, ry: 28, rz: 0, scale: 1.05,
    lcdLine1: 'VERIGATE',
    lcdLine2: 'READY · SCAN',
    screenState: 'idle'
  },
  {
    eyebrow: 'Tap. Verified. Welcome.',
    headline: <>Approved <em className="serif-italic grad-text">in seconds</em>.</>,
    body: 'A single rocker switch. A 9V backup cell tucked behind. The driver taps, the device confirms — green light, gate open, the whole product in your hand.',
    rx: -4, ry: -10, rz: 0, scale: 1.05,
    lcdLine1: 'APPROVED',
    lcdLine2: 'WELCOME',
    screenState: 'approved'
  },
];

function Hero3D(){
  const sectionRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const sec = sectionRef.current;
    const stage = stageRef.current;
    if (!sec || !stage) return;

    let raf = 0;
    let lastT = -1;

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = sec.getBoundingClientRect();
        const vh = window.innerHeight;
        // total scrollable distance through this section
        const total = rect.height - vh;
        const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        const t = total > 0 ? passed / total : 0;
        if (t === lastT) return;
        lastT = t;

        // Map t (0..1) across chapters
        const segments = CHAPTERS.length - 1; // # of transitions
        const chapPos = t * segments;
        const idx = Math.floor(chapPos);
        const local = chapPos - idx;
        const a = CHAPTERS[Math.min(idx, CHAPTERS.length - 1)];
        const b = CHAPTERS[Math.min(idx + 1, CHAPTERS.length - 1)];

        const lerp = (x, y) => x + (y - x) * local;
        const rx = lerp(a.rx, b.rx);
        const ry = lerp(a.ry, b.ry);
        const rz = lerp(a.rz, b.rz);
        const sc = lerp(a.scale, b.scale);

        const wrap = stage.querySelector('.d3d-wrap');
        if (wrap){
          wrap.style.setProperty('--rx', rx + 'deg');
          wrap.style.setProperty('--ry', ry + 'deg');
          wrap.style.setProperty('--rz', rz + 'deg');
          wrap.style.setProperty('--scale', sc);
        }

        // Determine active chapter based on midpoint
        const next = Math.min(Math.round(chapPos), CHAPTERS.length - 1);
        setActive((cur) => cur === next ? cur : next);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const activeChapter = CHAPTERS[active];

  return (
    <section ref={sectionRef} className="hero3d" id="product">
      <div className="hero3d-inner">
        <div className="hero3d-copy-col">
          {CHAPTERS.map((c, i) => (
            <div key={i} className={'hero3d-chapter' + (i === active ? ' is-active' : '')}>
              <span className="hero3d-eyebrow"><span className="dot"></span>{c.eyebrow}</span>
              <h1 className="hero3d-display">{c.headline}</h1>
              <p className="hero3d-lede">{c.body}</p>
              {i === 0 && (
                <div className="hero3d-cta">
                  <a href="#contact" className="btn primary big">
                    Request a demo
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </a>
                  <a href="#process" className="btn ghost big">See it work</a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div ref={stageRef} className="hero3d-stage-col">
          <div className="hero3d-sticky">
            <div className="hero3d-glow"></div>
            <div className="hero3d-grid"></div>
            <Device3D
              id="hero-device"
              interactive={false}
              showCard={false}
              lcdLine1={activeChapter.lcdLine1}
              lcdLine2={activeChapter.lcdLine2}
              screenState={activeChapter.screenState}
            />
            <div className="hero3d-progress">
              {CHAPTERS.map((_, i) => <i key={i} className={i === active ? 'on' : ''} />)}
            </div>
            <div className="hero3d-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              <span>Scroll to rotate</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero3d{
          position:relative;
          width: min(1320px, calc(100% - 32px));
          margin: 24px auto 0;
          /* Tall section so we get scroll travel */
          min-height: 280vh;
        }
        .hero3d-inner{
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: clamp(40px, 5vw, 80px);
          align-items: start;
        }
        .hero3d-copy-col{
          display: flex;
          flex-direction: column;
          padding-top: 18vh;
        }
        .hero3d-chapter{
          min-height: 88vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          opacity: .25;
          filter: blur(.4px);
          transition: opacity .6s cubic-bezier(.22,.61,.36,1), filter .6s ease;
        }
        .hero3d-chapter.is-active{ opacity: 1; filter: none; }

        .hero3d-eyebrow{
          display:inline-flex; align-items:center; gap:10px;
          font: 500 12px/1 var(--font-mono);
          letter-spacing: .22em; text-transform: uppercase;
          color: var(--muted);
          padding: 8px 12px;
          border:1px solid var(--line);
          border-radius: 999px;
          background: rgba(255,255,255,.02);
          width: max-content;
        }
        .hero3d-eyebrow .dot{
          width:8px; height:8px; border-radius:50%;
          background: var(--accent);
          box-shadow: 0 0 0 4px rgba(91,140,255,.18), 0 0 18px rgba(91,140,255,.7);
          animation: pulse 2.4s ease-in-out infinite;
        }
        @keyframes pulse{ 50%{ box-shadow: 0 0 0 8px rgba(91,140,255,.05), 0 0 22px rgba(91,140,255,.85); } }

        .hero3d-display{
          font-family: var(--font-display); font-weight: 600;
          font-size: clamp(34px, 4.6vw, 64px); line-height: 1.04;
          letter-spacing: -0.025em; text-wrap: balance;
          margin: 6px 0 8px;
        }
        .hero3d-display em{
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 400;
          letter-spacing: -0.012em;
          font-size: 1.06em;
        }
        .grad-text{
          background: linear-gradient(180deg,#FFFFFF 0%, #C5D4FF 45%, #5B8CFF 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .hero3d-lede{
          font-size: clamp(16px, 1.2vw, 19px);
          line-height: 1.6;
          color: #C9D1E2;
          max-width: 52ch;
        }
        .hero3d-cta{ display:flex; gap:14px; flex-wrap:wrap; margin-top: 14px; }

        /* Sticky 3D stage */
        .hero3d-stage-col{
          position: relative;
          align-self: stretch;
        }
        .hero3d-sticky{
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hero3d-glow{
          position:absolute; inset: 12% 12%;
          border-radius: 50%;
          background: radial-gradient(closest-side, rgba(91,140,255,.18), transparent 75%);
          filter: blur(20px);
          pointer-events: none;
          z-index: 0;
          transition: background .8s ease;
        }
        /* Green glow when device shows approved state */
        .hero3d-stage-col:has(.is-approved) .hero3d-glow{
          background: radial-gradient(closest-side, rgba(110,231,183,.22), transparent 75%);
        }
        .hero3d-grid{
          position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(158,183,255,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(158,183,255,.06) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(closest-side at 50% 50%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(closest-side at 50% 50%, #000 30%, transparent 75%);
          pointer-events: none;
          z-index: 0;
        }
        .hero3d-sticky > .d3d-wrap{
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 1;
          /* Smaller device — fits comfortably alongside the text column */
          transform: scale(1.4);
        }
        @media (max-width: 1280px){ .hero3d-sticky > .d3d-wrap{ transform: scale(1.2); } }
        @media (max-width: 1020px){ .hero3d-sticky > .d3d-wrap{ transform: scale(1.05); } }

        .hero3d-progress{
          position:absolute;
          left: 50%;
          bottom: 32px;
          transform: translateX(-50%);
          display:flex; gap: 10px;
          z-index: 2;
        }
        .hero3d-progress i{
          display:block; width: 28px; height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,.14);
          transition: background .35s ease, transform .35s ease;
        }
        .hero3d-progress i.on{
          background: linear-gradient(90deg, #9EB7FF, #5B8CFF);
          box-shadow: 0 0 12px rgba(91,140,255,.6);
          transform: scaleX(1.15);
        }

        .hero3d-hint{
          position:absolute;
          right: 24px;
          bottom: 32px;
          display: inline-flex; align-items: center; gap: 8px;
          font: 500 10.5px/1 var(--font-mono);
          letter-spacing: .18em;
          text-transform: uppercase;
          color: var(--muted);
          opacity: .8;
          z-index: 2;
        }
        .hero3d-hint svg{
          width: 14px; height: 14px;
          color: var(--accent-2);
          animation: hintBounce 2s ease-in-out infinite;
        }
        @keyframes hintBounce{ 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(4px); } }

        @media (max-width: 1020px){
          .hero3d{ min-height: auto; }
          .hero3d-inner{
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .hero3d-copy-col{ padding-top: 0; order: 2; }
          .hero3d-chapter{
            min-height: auto;
            opacity: 1;
            filter: none;
            padding: 24px 0;
          }
          .hero3d-stage-col{ order: 1; height: 70vh; }
          .hero3d-sticky{ position: relative; height: 100%; }
          .hero3d-hint{ display: none; }
        }
      `}</style>
    </section>
  );
}

window.Hero3D = Hero3D;
