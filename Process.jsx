/* Process — video frame + 4-step list */
const STEPS = [
  {
    n: '01',
    t: 'Pull up. Tap in.',
    s: 'The driver arrives at the gate, RFID card or fob in hand. One tap on the SCAN panel kicks off the shipment lookup — no clipboard, no paperwork, no wait.'
  },
  {
    n: '02',
    t: 'The dock knows.',
    s: 'The matching shipment loads on the LCD in under 200 ms — driver, ID, manifest — and the record streams to the central database in real time.'
  },
  {
    n: '03',
    t: 'Numbers don’t lie.',
    s: 'The worker unloads the cargo onto the scale and watches the live weight reconcile against the expected value on the dashboard, side by side.'
  },
  {
    n: '04',
    t: 'Green light. Done.',
    s: 'One press. Approved — the LCD flashes green, the gate opens, the ledger updates everywhere. Rejected — the discrepancy is logged automatically.'
  },
];

function Process(){
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [time, setTime] = React.useState('00:00');

  const fmt = (t) => {
    if (!isFinite(t)) return '00:00';
    const m = Math.floor(t/60), s = Math.floor(t%60);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const play = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = false;
    v.play().then(() => setPlaying(true)).catch(() => { v.muted = true; v.play().then(() => setPlaying(true)).catch(()=>{}); });
  };
  const toggle = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) play();
    else { v.pause(); setPlaying(false); }
  };

  return (
    <section className="section" id="process">
      <header className="section-head reveal">
        <span className="kicker">The process</span>
        <h2 className="display-2">Tap. Match. <em className="serif-italic">Approve</em>.</h2>
      </header>

      <div className="video-stage reveal">
        <div className="video-frame">
          <div className="video-glow"></div>
          <video ref={videoRef} className="video-el" preload="metadata" playsInline poster="./process-thumbnail.jpg"
            onClick={toggle}
            onTimeUpdate={(e) => setTime(fmt(e.currentTarget.currentTime))}
            onEnded={() => setPlaying(false)}>
            <source src="./process.mp4" type="video/mp4"/>
          </video>
          {!playing && <button className="video-play" onClick={play} aria-label="Play process video">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>}
          <div className="video-tape">
            <span>Process · Walkthrough</span>
            <span className="time">{time}</span>
          </div>
        </div>
      </div>

      <ul className="steps">
        {STEPS.map((s, i) => (
          <li key={s.n} className={'step reveal delay-' + (i + 1)}>
            <span className="step-num">{s.n}</span>
            <div><h3>{s.t}</h3><p>{s.s}</p></div>
            <span className="step-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </li>
        ))}
      </ul>

      <style>{`
        .display-2{ font-family: var(--font-display); font-weight: 600; font-size: clamp(32px, 4.8vw, 60px); line-height: 1.04; letter-spacing: -0.028em; margin: 14px 0 18px; color: var(--text); }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 1.06em; color: var(--accent); }
        .video-stage{ margin: 0 auto 56px; width: 100%; }
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
        .video-el{ position:relative; z-index:1; width:100%; height:100%; object-fit: cover; object-position: center; background:#000; cursor: pointer; }
        .video-play{
          position:absolute; inset:0; z-index:3;
          display:grid; place-items:center;
          background: linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.45));
          border:0; cursor: pointer;
          transition: opacity .35s ease;
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
        .video-tape{
          position:absolute; left:0; right:0; bottom:0; z-index:2;
          display:flex; justify-content:space-between; align-items:center;
          padding: 10px 16px;
          font: 600 11px/1 var(--font-mono);
          letter-spacing:.18em; text-transform:uppercase;
          color: #FFFFFF;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,.6) 60%);
          pointer-events: none;
        }
        .video-tape .time{ color: var(--accent-2); }
        .steps{ list-style:none; padding:0; margin:0; display:grid; gap: 14px; }
        .step{
          position: relative;
          display:grid; grid-template-columns: 130px 1fr 36px; gap: 24px; align-items:center;
          padding: 28px 30px;
          border-radius: var(--r-lg);
          border:1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow-sm);
          transition:
            transform .55s var(--easing-out),
            border-color .35s var(--easing),
            box-shadow .45s var(--easing);
          will-change: transform;
          overflow: hidden;
        }
        .step::before{
          content: "";
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, transparent, var(--accent), transparent);
          transform: scaleY(0);
          transform-origin: center;
          transition: transform .6s var(--easing-out);
        }
        .step:hover{
          transform: translateX(10px);
          border-color: var(--line-2);
          box-shadow: var(--shadow-lg);
        }
        .step:hover::before{ transform: scaleY(1); }
        .step:hover .step-num{ -webkit-text-stroke-color: var(--accent); }
        .step-num{
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 60px);
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(124,138,255,.45);
          letter-spacing: -0.02em;
          transition: -webkit-text-stroke-color .35s var(--easing);
        }
        .step-arrow{
          display: inline-flex; align-items: center; justify-content: center;
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1px solid var(--line);
          color: var(--accent);
          opacity: 0;
          transform: translateX(-10px);
          transition:
            opacity .35s var(--easing),
            transform .45s var(--easing-spring),
            background .35s var(--easing),
            border-color .35s var(--easing);
        }
        .step-arrow svg{ width: 16px; height: 16px; }
        .step:hover .step-arrow{
          opacity: 1;
          transform: translateX(0);
          background: rgba(124,138,255,.08);
          border-color: var(--line-3);
        }
        .step h3{ margin:0 0 6px; font-size: 21px; letter-spacing: -0.012em; font-family: var(--font-display); color: var(--text); }
        .step p{ margin:0; color: var(--muted); line-height:1.55; }
        @media (max-width: 760px){
          .step{ grid-template-columns: 1fr; gap: 8px; padding: 22px 22px; }
          .step-num{ font-size: 28px; }
          .step-arrow{ display: none; }
          .step:hover{ transform: translateX(4px); }
        }
      `}</style>
    </section>
  );
}

window.Process = Process;
