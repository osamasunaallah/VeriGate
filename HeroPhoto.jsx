/* HeroPhoto — the opening screen.
   Eyebrow → headline → 3D device → lede → CTAs → step dots.

   The three chapters cycle on their own (every 4.5 s, only while the hero
   is on screen). All three headlines and ledes sit stacked in the same
   grid cell, so the block is always as tall as the longest one and the
   page never jumps when the text changes. The backdrop is plain
   gradients (no blur filters, no infinite animations) so the WebGL device
   in front of it stays smooth. */

const HERO_CHAPTERS = [
  {
    eyebrow: 'One tap. One verified shipment.',
    headlineA: 'A receiving device,',
    headlineB: 'verified instantly.',
    body: 'The driver taps an RFID card. The device pulls the matching shipment from the dashboard, shows it on the LCD, and lets the worker approve it in seconds.',
    lcdLine1: 'VERIGATE',
    lcdLine2: 'READY · SCAN',
    state: 'idle',
  },
  {
    eyebrow: 'Inside the enclosure',
    headlineA: 'Built around an Arduino',
    headlineB: 'and a 13.56 MHz reader.',
    body: 'A matte-black shell, a 16×2 LCD behind anti-glare glass, and the reader flush behind the SCAN panel.',
    lcdLine1: 'WAITING',
    lcdLine2: 'TAP CARD',
    state: 'idle',
  },
  {
    eyebrow: 'Tap. Verified. Welcome.',
    headlineA: 'Approved',
    headlineB: 'in seconds.',
    body: 'The driver taps, the device confirms: green light, gate open, and the shipment is in your ledger.',
    lcdLine1: 'APPROVED',
    lcdLine2: 'WELCOME',
    state: 'approved',
  },
];
const HERO_CYCLE_MS = 4500;

function HeroWords({ text, on, accent }){
  return text.split(' ').map((w, i) => (
    <span key={i} className="hp-word">
      <span className={'hp-word-in' + (accent ? ' is-accent' : '')} style={{ transitionDelay: on ? (i * 55 + 260) + 'ms' : '0ms' }}>{w}</span>
    </span>
  ));
}

function HeroPhoto(){
  const sectionRef = React.useRef(null);
  const [active, setActive] = React.useState(0);
  const [tick, setTick] = React.useState(0);     // restarts the timer after a dot click

  // auto-advance, but only while the hero is visible and the tab is open
  React.useEffect(() => {
    let visible = true;
    const el = sectionRef.current;
    const io = el && 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.2 }) : null;
    if (io) io.observe(el);
    const id = setInterval(() => {
      if (visible && !document.hidden) setActive(a => (a + 1) % HERO_CHAPTERS.length);
    }, HERO_CYCLE_MS);
    return () => { clearInterval(id); if (io) io.disconnect(); };
  }, [tick]);

  const approved = HERO_CHAPTERS[active].state === 'approved';

  return (
    <section ref={sectionRef} className={'hp' + (approved ? ' is-approved' : '')} id="product">
      <div className="hp-bg" aria-hidden="true"><i className="hp-bg-ok"></i></div>

      <div className="hp-shell">
        <header className="hp-head">
          <div className="hp-stack hp-eyebrows">
            {HERO_CHAPTERS.map((c, i) => (
              <span key={i} className={'hp-eyebrow' + (i === active ? ' on' : '')} aria-hidden={i !== active}>
                <span className="hp-eyebrow-dot"></span>{c.eyebrow}
              </span>
            ))}
          </div>

          <h1 className="hp-stack hp-headline">
            {HERO_CHAPTERS.map((c, i) => (
              <span key={i} className={'hp-hl' + (i === active ? ' on' : '')} aria-hidden={i !== active}>
                <span className="hp-hl-line"><HeroWords text={c.headlineA} on={i === active} /></span>
                <span className="hp-hl-line"><HeroWords text={c.headlineB} on={i === active} accent /></span>
              </span>
            ))}
          </h1>

          <div className="hp-stack hp-ledes">
            {HERO_CHAPTERS.map((c, i) => (
              <p key={i} className={'hp-lede' + (i === active ? ' on' : '')} aria-hidden={i !== active}>{c.body}</p>
            ))}
          </div>
        </header>

        <div className="hp-stage">
          <div className="hp-halo" aria-hidden="true"></div>
          <div className="hp-device-wrap">
            <DeviceWithLCD activeChapter={active} chapters={HERO_CHAPTERS} className="hp-device-3d" />
            <div className="hp-floor" aria-hidden="true"></div>
          </div>
        </div>

        <footer className="hp-foot">
          <div className="hp-cta-row">
            <a href="https://www.linkedin.com/in/osamasunaallah/" target="_blank" rel="noopener noreferrer" className="btn primary big">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.75c0-2.33-1.25-3.42-2.92-3.42-1.35 0-1.95.74-2.29 1.26V9.67h-2.67v8.67h2.67v-4.29c0-1.13.21-2.22 1.61-2.22 1.38 0 1.4 1.29 1.4 2.29v4.22h2.2z"/></svg>
              Connect on LinkedIn
            </a>
            <a href="#process" className="btn ghost big">
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>
              See it work
            </a>
          </div>
          <div className="hp-dots" role="tablist" aria-label="Hero chapters">
            {HERO_CHAPTERS.map((c, i) => (
              <button key={i} role="tab" aria-selected={i === active} aria-label={'Show chapter ' + (i + 1)}
                className={'hp-dot' + (i === active ? ' on' : '')}
                onClick={() => { setActive(i); setTick(t => t + 1); }}>
                <span className="hp-dot-bar"><i key={active + '-' + tick} style={{ animationDuration: HERO_CYCLE_MS + 'ms' }}></i></span>
              </button>
            ))}
          </div>
        </footer>
      </div>

      <style>{`
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
      `}</style>
    </section>
  );
}

window.HeroPhoto = HeroPhoto;
