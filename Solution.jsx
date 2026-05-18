/* 2-col split: text + sticky parallax product photo */
const POINTS = [
  { n: '01', t: 'Bind a card to a driver', s: 'One MIFARE card per driver, one tap per arrival.' },
  { n: '02', t: 'Match shipment at the gate', s: 'The dashboard answers before the driver lifts their hand.' },
  { n: '03', t: 'Approve in seconds', s: 'A worker confirms on the LCD. The ledger updates everywhere.' },
];

function Solution(){
  return (
    <section className="section" data-solution>
      <div className="solution-grid">
        <div className="solution-text reveal">
          <span className="kicker">The solution</span>
          <h2 className="display-2">A device that <em className="serif-italic">closes the loop</em>.</h2>
          <p className="lede">Verigate sits on the receiving counter. The driver taps a card. The shipment appears. The worker approves. That's the whole story.</p>
          <ul className="solution-points">
            {POINTS.map(p => (
              <li key={p.n}><span className="sp-num">{p.n}</span><div><b>{p.t}</b><small>{p.s}</small></div></li>
            ))}
          </ul>
        </div>
        <figure className="solution-figure reveal" id="solutionFigure">
          <div className="sf-frame">
            <img src="./wallpaper.jpg" alt="Verigate device on a receiving counter"/>
          </div>
          <div className="sf-tag"><i></i>Live · Gate 04</div>
        </figure>
      </div>
      <style>{`
        .display-2{ font-family: var(--font-display); font-weight: 600; font-size: clamp(32px, 4.8vw, 60px); line-height: 1.04; letter-spacing: -0.028em; margin: 14px 0 18px; color: var(--text); }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 1.06em; color: var(--accent); }
        .lede{ font-size: clamp(17px, 1.35vw, 20px); line-height: 1.6; color: var(--text-2); max-width: 60ch; }
        .solution-grid{ display:grid; grid-template-columns: 1fr 1.05fr; gap: clamp(28px, 4vw, 64px); align-items: start; }
        .solution-text{ display:flex; flex-direction:column; gap: 14px; }
        .solution-text .lede{ margin-top: 8px; max-width: 50ch; }
        .solution-points{ list-style:none; padding:0; margin: 28px 0 0; display:grid; gap: 12px; }
        .solution-points li{
          display:grid; grid-template-columns: 56px 1fr; gap: 16px;
          align-items:center;
          padding: 18px 20px;
          border-radius: var(--r-md);
          border:1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow-sm);
          transition: transform .35s var(--easing-out), border-color .25s ease, box-shadow .3s ease;
        }
        .solution-points li:hover{
          transform: translateX(6px);
          border-color: var(--line-3);
          box-shadow: var(--shadow-md);
        }
        .sp-num{
          display:inline-flex; align-items:center; justify-content:center;
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(160deg, rgba(124,138,255,.10), rgba(124,138,255,.02));
          border:1px solid rgba(124,138,255,.22);
          font: 600 13px/1 var(--font-mono);
          color: var(--accent);
        }
        .solution-points b{ display:block; font-weight:600; margin-bottom: 2px; font-family: var(--font-display); font-size: 15.5px; color: var(--text); }
        .solution-points small{ color: var(--muted); font-size: 13.5px; }
        .solution-figure{ position: sticky; top: 100px; margin: 0; }
        .sf-frame{
          position:relative;
          border-radius: var(--r-xl);
          overflow:hidden;
          border:1px solid var(--line);
          box-shadow: var(--shadow-lg);
          background: var(--surface);
        }
        .sf-frame img{ width: 100%; height: auto; display: block; }
        .sf-tag{
          position:absolute; left: 32px; bottom: 32px;
          display:inline-flex; align-items:center; gap:8px;
          padding: 8px 12px; border-radius: 999px;
          border:1px solid var(--line-3);
          background: rgba(255,255,255,.9);
          backdrop-filter: blur(8px);
          font: 600 11px/1 var(--font-mono);
          letter-spacing:.16em; text-transform:uppercase;
          color: var(--text);
        }
        .sf-tag i{
          width: 8px; height: 8px; border-radius:50%;
          background: var(--accent);
          box-shadow: 0 0 14px rgba(124,138,255,.6);
          animation: pulse2 2.2s ease-in-out infinite;
        }
        @keyframes pulse2{ 50%{ box-shadow: 0 0 0 8px rgba(124,138,255,0); } }
        @media (max-width: 900px){ .solution-grid{ grid-template-columns: 1fr; gap: 36px; } .solution-figure{ position: static; top: auto; } }
      `}</style>
    </section>
  );
}

window.Solution = Solution;
