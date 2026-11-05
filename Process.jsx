/* Process — the 3D receiving animation (ReceivingScene) + 4-step list.
   It plays like a video: play/pause, a seek bar with a mark per step,
   and it starts on its own when it scrolls into view. */
const STEPS = [
  { n: '01', t: 'Pull up. Tap in.',     s: 'The driver arrives with the shipment and taps his RFID card on the SCAN panel.' },
  { n: '02', t: 'The dock knows.',      s: 'The matching shipment shows on the LCD in under 200 ms and the gate approves it.' },
  { n: '03', t: 'Numbers don’t lie.', s: 'The worker sets the box on the scale; the live weight is checked against the order.' },
  { n: '04', t: 'Green light. Done.',   s: 'The iPad shows QTY MATCH and the shipment is recorded. A mismatch is logged.' },
];

const fmt = (t) => {
  if (!isFinite(t) || t < 0) return '00:00';
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
};

function Process(){
  const DUR = window.RS_DUR || 26;
  const CH = window.RS_CHAPTERS || [0, 6.6, 9.8, 19.2];
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timeRef = React.useRef(0);           // the 3D scene reads this every frame
  const frameRef = React.useRef(null);
  const userPaused = React.useRef(false);    // a pause the visitor chose survives scrolling
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState(0);

  // the clock: advances the shared time while playing, loops at the end
  React.useEffect(() => {
    if (!playing) return undefined;
    let raf = 0, last = performance.now(), lastUi = 0;
    const tick = (now) => {
      timeRef.current = (timeRef.current + (now - last) / 1000) % DUR;
      last = now;
      if (now - lastUi > 100){ lastUi = now; setTime(timeRef.current); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // starts when it scrolls into view, pauses when it leaves
  React.useEffect(() => {
    const el = frameRef.current;
    if (!el || reduced || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused.current) setPlaying(true);
      if (!e.isIntersecting) setPlaying(false);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = () => { userPaused.current = playing; setPlaying(!playing); };
  const seekTo = (t) => { timeRef.current = Math.max(0, Math.min(DUR - .01, t)); setTime(timeRef.current); };
  const seek = (e) => { const r = e.currentTarget.getBoundingClientRect(); seekTo(((e.clientX - r.left) / r.width) * DUR); };

  let chapter = 0; CH.forEach((c, i) => { if (time >= c) chapter = i; });

  return (
    <section className="section" id="process">
      <header className="section-head center reveal">
        <span className="kicker">The process</span>
        <h2 className="display-2">Tap. Match. <em className="serif-italic">Approve</em>.</h2>
      </header>

      <div className="video-stage reveal">
        <div ref={frameRef} className="video-frame">
          <div className="video-glow"></div>
          <div className="rs-wrap" onClick={toggle}>{window.ReceivingScene ? <ReceivingScene timeRef={timeRef} /> : null}</div>
          {!playing && <button className="video-play" onClick={() => { userPaused.current = false; setPlaying(true); }} aria-label="Play the process animation">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>}
          <div className="video-bar">
            <button className="video-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              {playing
                ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <div className="video-track" onClick={seek} role="slider" tabIndex={0} aria-label="Seek"
              aria-valuemin={0} aria-valuemax={DUR} aria-valuenow={Math.round(time)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight'){ e.preventDefault(); seekTo(time + 2); }
                if (e.key === 'ArrowLeft'){ e.preventDefault(); seekTo(time - 2); }
              }}>
              {CH.slice(1).map(c => <span key={c} className="rs-mark" style={{ left: (c / DUR * 100) + '%' }}></span>)}
              <span className="video-track-fill" style={{ width: (time / DUR * 100) + '%' }}></span>
            </div>
            <span className="time">{fmt(time)} / {fmt(DUR)}</span>
          </div>
        </div>
      </div>

      <ul className="steps">
        {STEPS.map((s, i) => (
          <li key={s.n} className={'step reveal delay-' + (i + 1) + (i === chapter ? ' is-active' : '')}
              onClick={() => { seekTo(CH[i] + .01); userPaused.current = false; setPlaying(true); }}>
            <span className="step-num">{s.n}</span>
            <div><h3>{s.t}</h3><p>{s.s}</p></div>
            <span className="step-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </li>
        ))}
      </ul>

      <style>{`
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
        .video-play:hover svg{ transform: scale(1.06); }
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
        .step:hover{ transform: translateY(-4px); border-color: var(--line-2); box-shadow: var(--shadow-md); }
        .step:hover::before, .step.is-active::before{ transform: scaleX(1); }
        .step.is-active{ border-color: var(--line-3); background: linear-gradient(180deg, rgba(124,138,255,.10), rgba(124,138,255,.02)), var(--surface); }
        .step-num{
          font-family: var(--font-display); font-size: 34px; line-height: 1; letter-spacing: -0.02em;
          color: transparent; -webkit-text-stroke: 1.2px rgba(124,138,255,.5);
          transition: -webkit-text-stroke-color .35s var(--easing);
        }
        .step:hover .step-num, .step.is-active .step-num{ -webkit-text-stroke-color: var(--accent-2); }
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
      `}</style>
    </section>
  );
}

window.Process = Process;
