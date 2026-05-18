/* 3-up icon-tile capability cards */
const CAPS = [
  { accent: 'a', title: 'Tap once. Done.',          tag: 'LATENCY',
    desc: 'The reader picks up the card the instant it touches the panel. The dashboard answers in under 200 ms.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M5 8a8 8 0 0 1 14 0M2 5a12 12 0 0 1 20 0"/></svg> },
  { accent: 'b', title: 'Verified at the source',   tag: 'TRUST',
    desc: 'Each card is bound to one driver. The shipment that appears on the LCD is the shipment in the ledger.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg> },
  { accent: 'c', title: 'No paperwork. No retyping.', tag: 'WORKFLOW',
    desc: 'Approvals move from a clipboard to a button. Every event lands in the same dashboard, in real time.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h6M8 16h8"/></svg> },
];

function Capabilities(){
  return (
    <section className="section" id="capabilities">
      <header className="section-head reveal">
        <span className="kicker">Capabilities</span>
        <h2 className="display-2">Built for the gate, <em className="serif-italic">not the office</em>.</h2>
      </header>
      <div className="cap-grid">
        {CAPS.map((c, i) => (
          <article
            key={i}
            className={'cap reveal delay-' + (i + 1)}
            data-accent={c.accent}
          >
            <div className="cap-shine" aria-hidden="true"></div>
            <div className="cap-ico">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
            <span className="cap-tag">{c.tag}</span>
          </article>
        ))}
      </div>
      <style>{`
        .display-2{ font-family: var(--font-display); font-weight: 600; font-size: clamp(32px, 4.8vw, 60px); line-height: 1.04; letter-spacing: -0.028em; margin: 14px 0 18px; text-wrap: balance; color: var(--text); }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 1.06em; color: var(--accent); }
        .cap-grid{ display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 18px; }
        .cap{
          position:relative; overflow:hidden;
          padding: 28px 26px 24px;
          border-radius: var(--r-lg);
          border: 1px solid var(--line);
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
        }
        .cap::before{
          content:""; position:absolute; inset:0;
          background: radial-gradient(420px 200px at 0% 0%, rgba(124,138,255,.06), transparent 70%);
          opacity:0; transition: opacity .45s var(--easing);
          pointer-events:none;
        }
        .cap::after{
          content:""; position:absolute; left:0; top:0; bottom:0;
          width: 3px;
          background: linear-gradient(180deg, transparent, var(--accent), transparent);
          transform: scaleY(0); transform-origin: center;
          transition: transform .55s var(--easing-out);
        }
        .cap:hover{
          transform: translateY(-8px);
          border-color: var(--line-2);
          box-shadow: var(--shadow-lg);
        }
        .cap:hover::before{ opacity:1; }
        .cap:hover::after{ transform: scaleY(1); }
        .cap-shine{
          position: absolute; inset: 0;
          background: linear-gradient(115deg,
            transparent 30%,
            rgba(124,138,255,.07) 48%,
            rgba(124,138,255,.14) 50%,
            rgba(124,138,255,.07) 52%,
            transparent 70%);
          opacity: 0;
          transform: translateX(-30%);
          transition: opacity .5s var(--easing), transform 1.1s var(--easing-out);
          pointer-events: none;
          z-index: 1;
        }
        .cap:hover .cap-shine{ opacity: 1; transform: translateX(30%); }
        .cap:hover .cap-ico{ transform: rotate(-6deg) scale(1.05); }
        .cap-ico{
          position: relative; z-index: 2;
          width:48px; height:48px; border-radius: 14px;
          display:inline-flex; align-items:center; justify-content:center;
          background: linear-gradient(160deg, rgba(124,138,255,.10), rgba(124,138,255,.02));
          border:1px solid rgba(124,138,255,.22);
          color: var(--accent);
          margin-bottom: 20px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
          transition: transform .45s var(--easing-spring);
        }
        .cap-ico svg{ width: 22px; height: 22px; }
        .cap[data-accent="b"] .cap-ico{
          background: linear-gradient(160deg, rgba(126,227,181,.10), rgba(126,227,181,.02));
          border-color: rgba(126,227,181,.22);
          color: var(--ok);
        }
        .cap[data-accent="c"] .cap-ico{
          background: linear-gradient(160deg, rgba(167,139,250,.12), rgba(167,139,250,.02));
          border-color: rgba(167,139,250,.26);
          color: #C57400;
        }
        .cap h3{ font-family: var(--font-display); font-size: 20px; margin: 0 0 8px; letter-spacing:-0.012em; color: var(--text); position: relative; z-index: 2; }
        .cap p{ color: var(--muted); margin: 0 0 18px; font-size: 14.5px; line-height: 1.6; position: relative; z-index: 2; }
        .cap-tag{
          position: relative; z-index: 2;
          display:inline-block;
          font: 500 10.5px/1 var(--font-mono);
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--accent);
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(124,138,255,.06);
        }
        .cap[data-accent="b"] .cap-tag{ color: var(--ok); border-color: var(--line-ok); background: rgba(126,227,181,.06); }
        .cap[data-accent="c"] .cap-tag{ color: #C57400; border-color: rgba(167,139,250,.30); background: rgba(167,139,250,.08); }
        @media (max-width: 980px){ .cap-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 620px){ .cap-grid{ grid-template-columns: 1fr; } }
      `}</style>
    </section>
  );
}

window.Capabilities = Capabilities;
