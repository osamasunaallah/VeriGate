/* 3-up numbered problem cards */
const PROBS = [
  { num: '01', title: 'Paper at the gate',
    desc: 'Clipboards lose. Receipts vanish. Every untracked tap leaves a hole in the ledger that nobody finds until the audit.' },
  { num: '02', title: 'Retyped data',
    desc: 'Drivers say one thing, the warehouse types another. Mismatches surface days later, when the trail is already cold.' },
  { num: '03', title: 'No source of truth',
    desc: 'The dashboard, the inbox, and the gate run separate stories. Reconciliation is a person — and that person is always behind.' },
];

function Problems(){
  const gridRef = React.useRef(null);
  const [stackIn, setStackIn] = React.useState(false);

  React.useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting){ setStackIn(true); io.disconnect(); }
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cursor-follow tilt on each card
  const onCardMove = (e) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty('--cx', x.toFixed(3));
    card.style.setProperty('--cy', y.toFixed(3));
  };
  const onCardLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--cx', '0');
    card.style.setProperty('--cy', '0');
  };

  return (
    <section className="section" id="problems">
      <header className="section-head reveal">
        <span className="kicker">The problem</span>
        <h2 className="display-2">Receiving runs on <em className="serif-italic">faith</em>.</h2>
      </header>
      <ul ref={gridRef} className={'prob-grid' + (stackIn ? ' is-spread' : '')}>
        {PROBS.map((p, i) => (
          <li
            key={p.num}
            className="prob"
            style={{ '--idx': i, '--n': PROBS.length }}
            onMouseMove={onCardMove}
            onMouseLeave={onCardLeave}
          >
            <span className="prob-glow" aria-hidden="true"></span>
            <span className="prob-shine" aria-hidden="true"></span>
            <span className="prob-num">{p.num}</span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </li>
        ))}
      </ul>
      <style>{`
        .display-2{ font-family: var(--font-display); font-weight: 600; font-size: clamp(32px, 4.8vw, 60px); line-height: 1.04; letter-spacing: -0.028em; margin: 14px 0 18px; color: var(--text); }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 1.06em; color: var(--accent); }
        .prob-grid{
          list-style:none; padding:0; margin: 0;
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 18px;
          perspective: 1200px;
        }
        .prob{
          --cx: 0;
          --cy: 0;
          --stack-x: calc(((var(--idx, 0) - (var(--n, 3) - 1) / 2) * 50%) * -1);
          --stack-rot: calc((var(--idx, 0) - (var(--n, 3) - 1) / 2) * -6deg);
          position:relative; overflow:hidden;
          padding: 30px 28px;
          border-radius: var(--r-lg);
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow-sm);
          transform-style: preserve-3d;
          transform:
            translate3d(var(--stack-x), 32px, 0)
            rotate(var(--stack-rot))
            scale(.92);
          opacity: 0;
          filter: blur(6px);
          transition:
            transform 1.1s cubic-bezier(.2,.85,.25,1),
            opacity .9s var(--easing-out),
            filter .7s var(--easing-out),
            border-color .35s var(--easing),
            box-shadow .45s var(--easing);
          transition-delay: calc(var(--idx, 0) * 120ms + 50ms);
          will-change: transform, opacity, filter;
        }
        .prob-grid.is-spread .prob{
          opacity: 1;
          filter: blur(0);
          transform:
            translate3d(0, 0, 0)
            rotate(0deg)
            scale(1);
        }
        .prob-grid.is-spread .prob:hover{
          transform:
            translate3d(0, -8px, 0)
            rotateX(calc(var(--cy) * -6deg))
            rotateY(calc(var(--cx) * 8deg))
            scale(1.015);
        }
        .prob::before{
          content:""; position:absolute; inset:auto 0 0 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transform: scaleX(0); transform-origin: left;
          transition: transform .65s var(--easing-out);
        }
        .prob:hover{
          border-color: var(--line-2);
          box-shadow: var(--shadow-lg);
        }
        .prob:hover::before{ transform: scaleX(1); }
        .prob-glow{
          position: absolute;
          right: -40px; top: -40px;
          width: 240px; height: 240px;
          background: radial-gradient(closest-side, rgba(124,138,255,.25), transparent 70%);
          opacity: 0;
          filter: blur(10px);
          transition: opacity .5s var(--easing);
          pointer-events: none;
        }
        .prob:hover .prob-glow{ opacity: 1; }
        /* Diagonal shine that tracks cursor pos */
        .prob-shine{
          position: absolute; inset: 0;
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(167,139,250,.06) 48%,
            rgba(167,139,250,.14) 50%,
            rgba(167,139,250,.06) 52%,
            transparent 70%);
          opacity: 0;
          transform: translateX(-30%);
          transition: opacity .5s var(--easing), transform 1.1s var(--easing-out);
          pointer-events: none;
        }
        .prob:hover .prob-shine{ opacity: 1; transform: translateX(30%); }
        .prob:hover .prob-num{
          background: rgba(124,138,255,.10);
          border-color: rgba(124,138,255,.36);
          color: var(--accent-3);
        }
        .prob-num{
          position: relative; z-index: 1;
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .22em;
          color: var(--accent);
          margin-bottom: 18px;
          display:inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(124,138,255,.05);
          transition: background .35s var(--easing), border-color .35s var(--easing), color .35s var(--easing);
        }
        .prob h3, .prob p{ position: relative; z-index: 1; }
        .prob h3{ font-family: var(--font-display); font-size: 22px; margin: 0 0 10px; letter-spacing:-0.012em; color: var(--text); }
        .prob p{ color: var(--muted); margin: 0; line-height: 1.6; }
        @media (max-width: 980px){ .prob-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 620px){ .prob-grid{ grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}

window.Problems = Problems;
