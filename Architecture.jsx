/* 5-node data-flow diagram with animated SVG dash flow + 4-up stats */
const ARCH_NODES = [
  { id: 'card',    label: 'RFID Card / Fob',    sub: 'CREDENTIAL',    icon: 'card' },
  { id: 'reader',  label: 'RC522 Reader',       sub: 'CAPTURE',       icon: 'wave' },
  { id: 'mcu',     label: 'Arduino UNO R4',     sub: 'BRAIN',         icon: 'chip', key: true },
  { id: 'cloud',   label: 'Verigate Dashboard', sub: 'SOURCE OF TRUTH', icon: 'cloud' },
  { id: 'lcd',     label: 'LCD 16×2',           sub: 'DRIVER',        icon: 'screen' },
];

const ICONS = {
  card:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14h2"/></svg>,
  wave:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M5 8a8 8 0 0 1 14 0M2 5a12 12 0 0 1 20 0"/></svg>,
  chip:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/></svg>,
  cloud:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 18h10a4 4 0 0 0 .5-7.96A6 6 0 0 0 6 11a4 4 0 0 0 1 7z"/></svg>,
  screen: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/></svg>,
};

function Architecture(){
  return (
    <section className="section" id="architecture">
      <header className="section-head center reveal">
        <span className="kicker"><span className="dot"></span>How it flows</span>
        <h2 className="display-2">Five parts. <em className="serif-italic">One source of truth</em>.</h2>
        <p className="lede center">A card touches the reader, the MCU asks the dashboard, and the LCD answers. Every shipment carries the same record from gate to ledger.</p>
      </header>

      <div className="arch reveal">
        <div className="arch-track">
          <svg className="arch-line" preserveAspectRatio="none" viewBox="0 0 1160 120">
            <defs>
              <linearGradient id="archG" x1="0" x2="1">
                <stop offset="0%"  stopColor="rgba(167,139,250,0)"/>
                <stop offset="50%" stopColor="rgba(167,139,250,.8)"/>
                <stop offset="100%" stopColor="rgba(167,139,250,0)"/>
              </linearGradient>
            </defs>
            <path d="M30 60 H1130" stroke="url(#archG)" strokeWidth="1.5" fill="none"/>
            <path className="flow" d="M30 60 H1130" stroke="rgba(124,138,255,.9)" strokeWidth="1.5" fill="none" strokeDasharray="4 12"/>
          </svg>

          <ul className="arch-nodes">
            {ARCH_NODES.map((n, i) => (
              <li
                key={n.id}
                className={'arch-node reveal delay-' + (i + 1) + (n.key ? ' arch-node-key' : '')}
              >
                <span className="arch-ico">{ICONS[n.icon]}</span>
                <b>{n.label}</b>
                <small>{n.sub}</small>
              </li>
            ))}
          </ul>
        </div>

        <ul className="arch-stats">
          <li><b>&lt; 200ms</b><span>End-to-end</span></li>
          <li><b>13.56 MHz</b><span>RFID</span></li>
          <li><b>5 V · SPI</b><span>Bus</span></li>
          <li><b>0</b><span>Mismatches</span></li>
        </ul>
      </div>

      <style>{`
        .display-2{ font-family: var(--font-display); font-weight: 600; font-size: clamp(32px, 4.8vw, 60px); line-height: 1.04; letter-spacing: -0.028em; margin: 14px 0 18px; text-wrap: balance; color: var(--text); }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; letter-spacing: -0.012em; font-size: 1.06em; color: var(--accent); }
        .lede.center{ margin: 36px auto 0; text-align:center; max-width: 70ch; }

        .arch{
          position:relative;
          padding: 36px clamp(20px, 3vw, 40px) 30px;
          border-radius: var(--r-xl);
          border: 1px solid var(--line);
          background:
            radial-gradient(900px 280px at 50% 0%, rgba(124,138,255,.14), transparent 65%),
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow-md);
          isolation:isolate;
        }
        .arch-track{ position:relative; padding: 16px 0 8px; }
        .arch-line{ position:absolute; left:0; right:0; top:50%; width:100%; height:120px; transform: translateY(-50%); pointer-events:none; }
        .arch-line .flow{ animation: archFlow 6s linear infinite; }
        @keyframes archFlow{ 0%{ stroke-dashoffset: 0; } 100%{ stroke-dashoffset: -1160; } }
        .arch-nodes{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 14px; position:relative; z-index:1; }
        .arch-node{
          position: relative;
          display:flex; flex-direction:column; align-items:center; gap: 8px;
          text-align:center;
          padding: 22px 14px 20px;
          border-radius: var(--r-md);
          border: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(8px);
          box-shadow: var(--shadow-sm);
          transition:
            transform .45s var(--easing-out),
            border-color .35s var(--easing),
            box-shadow .35s var(--easing);
          will-change: transform;
        }
        .arch-node:hover{
          transform: translateY(-6px);
          border-color: var(--line-3);
          box-shadow: var(--shadow-md);
        }
        .arch-node:hover .arch-ico{
          transform: rotate(-4deg) scale(1.08);
        }
        .arch-ico{
          width:48px; height:48px;
          border-radius: 14px;
          display:inline-flex; align-items:center; justify-content:center;
          background: linear-gradient(160deg, rgba(124,138,255,.10), rgba(124,138,255,.02));
          border:1px solid rgba(124,138,255,.22);
          color: var(--accent);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
          transition: transform .35s var(--easing-spring);
        }
        .arch-ico svg{ width: 22px; height: 22px; }
        .arch-node b{ font-family: var(--font-display); font-size: 14.5px; letter-spacing:-0.005em; color: var(--text); }
        .arch-node small{ font: 600 10.5px/1 var(--font-mono); letter-spacing:.16em; text-transform:uppercase; color: var(--muted); }
        .arch-node-key{
          border-color: rgba(124,138,255,.45);
          background: linear-gradient(180deg, var(--accent), var(--accent-3));
          color: #FFFFFF;
          box-shadow: var(--glow-accent);
        }
        .arch-node-key b, .arch-node-key small{ color: #FFFFFF; }
        .arch-node-key small{ opacity: .85; }
        .arch-node-key .arch-ico{
          color:#fff;
          background: rgba(255,255,255,.18);
          border-color: rgba(255,255,255,.35);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.3);
        }

        .arch-stats{
          list-style:none;
          padding: 26px 0 0;
          margin: 26px 0 0;
          border-top: 1px dashed var(--line);
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 14px;
        }
        .arch-stats li{ display:flex; flex-direction:column; align-items:center; gap: 4px; text-align:center; }
        .arch-stats b{
          font-family: var(--font-display);
          font-size: clamp(26px, 2.6vw, 36px);
          letter-spacing:-0.022em;
          color: var(--text);
        }
        .arch-stats span{ font: 600 11px/1 var(--font-mono); letter-spacing:.16em; text-transform:uppercase; color: var(--muted); }

        @media (max-width: 900px){
          .arch-nodes{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          .arch-line{ display:none; }
          .arch-stats{ grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
      `}</style>
    </section>
  );
}

window.Architecture = Architecture;
