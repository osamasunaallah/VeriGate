/* Slow ticker strip between sections */
function MarqueeStrip(){
  const items = [
    'TAP · LOOKUP · RENDER',
    'MIFARE 13.56 MHz',
    'ARDUINO UNO R4',
    'LCD 16 × 2',
    'VERIFIED AT THE GATE',
    'SPI · I²C · UART',
    '< 200 ms LATENCY',
    'RC522 · 3–5 cm',
  ];
  const track = [...items, ...items];
  return (
    <div className="strip">
      <div className="strip-track">
        {track.map((t, i) => <span key={i}>· {t}</span>)}
      </div>
      <style>{`
        .strip{
          position:relative;
          border-top:1px solid var(--line); border-bottom:1px solid var(--line);
          background: linear-gradient(180deg, var(--bg-2), var(--bg));
          overflow:hidden; padding: 18px 0; margin-top: 12px;
        }
        .strip::before, .strip::after{
          content: ""; position: absolute; top: 0; bottom: 0;
          width: 140px; z-index: 2; pointer-events: none;
        }
        .strip::before{ left: 0; background: linear-gradient(90deg, var(--bg) 10%, rgba(10,12,22,.7) 60%, transparent); }
        .strip::after{ right: 0; background: linear-gradient(-90deg, var(--bg) 10%, rgba(10,12,22,.7) 60%, transparent); }
        .strip-track{
          display:flex; gap: 30px; white-space:nowrap;
          font: 600 13px/1 var(--font-mono);
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--muted);
          animation: stripScroll 50s linear infinite;
          width: max-content;
        }
        .strip:hover .strip-track{ animation-play-state: paused; }
        @keyframes stripScroll{ from{ transform: translateX(0); } to{ transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce){
          .strip-track{ animation: none; }
        }
      `}</style>
    </div>
  );
}

window.MarqueeStrip = MarqueeStrip;
