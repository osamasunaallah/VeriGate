/* Components Explorer — exploded view with hotspots + side panel */
const COMPONENTS = {
  panel:   { name: 'SCAN Panel',     desc: 'The face of the device. Where the driver taps.', role: 'Marks the scan zone and houses the LCD window so the driver always knows where to place the card.', specs: [['Finish','Matte black ABS'],['Marking','Laser-etched'],['Window','Anti-glare LCD']] },
  lcd:     { name: 'LCD 16×2',       desc: 'A small two-line display.',                       role: 'Shows shipment info and system status in real time — driver name, scan result, approve prompt.', specs: [['Type','HD44780'],['Format','16 × 2 chars'],['Backlight','Blue LED']] },
  rfid:    { name: 'RC522 Reader',   desc: 'The 13.56 MHz RFID module.',                      role: 'Reads the card or fob ID the instant it touches the panel.', specs: [['Standard','MIFARE 13.56 MHz'],['Bus','SPI'],['Range','3–5 cm']] },
  mcu:     { name: 'Arduino UNO R4', desc: 'The brain of the device.',                        role: 'Reads the RFID, talks to the dashboard, and drives the LCD on every tap.', specs: [['MCU','Renesas RA4M1'],['Clock','48 MHz'],['I/O','USB · SPI · I²C · UART']] },
  wires:   { name: 'Wiring Harness', desc: 'Power and signal lines.',                         role: 'Keeps the boards connected with clean, reliable signal between the MCU, reader, and display.', specs: [['Gauge','22 AWG'],['Bus','SPI · 5 V · GND']] },
  battery: { name: '9 V Battery',    desc: 'Backup power.',                                   role: 'Keeps the device alive through short power dips so the gate never stalls mid-shipment.', specs: [['Cell','9 V alkaline'],['Use','Brownout backup']] },
  enclosure:{ name: 'Enclosure',     desc: 'The outer case.',                                 role: 'Protects the electronics and presents a clean, branded surface to the driver.', specs: [['Material','ABS composite'],['Finish','Matte black'],['Mount','Counter / wall']] },
  card:    { name: 'RFID Card',      desc: "A driver's credential, in card form.",            role: 'Each card is bound to one driver — tap it, and the matching shipment shows up.', specs: [['Type','MIFARE Classic 1K'],['Frequency','13.56 MHz']] },
  fob:     { name: 'RFID Keyfob',    desc: 'Same credential, in keyring form.',               role: "A drop-in alternative for drivers who'd rather carry a fob than a card.", specs: [['Type','MIFARE Classic'],['Form','Keyring fob']] },
};
const ORDER = ['panel','lcd','rfid','mcu','wires','battery','enclosure','card','fob'];
// Hotspot positions on the exploded.png (% of stage)
// Calibrated against the actual exploded.png (666 × 375):
//   1) SCAN panel  far-left front face
//   2) LCD module  green PCB next to panel
//   3) RC522       small reader board with antenna
//   4) Arduino     largest blue PCB in the centre
//   5) Wires       white connector with coloured leads
//   6) Battery     9V Duracell
//   7) Enclosure   black box at the back-right
//   8) Card        white RFID card (lower row)
//   9) Fob         blue keyring fob (lower row)
const HOTSPOTS = [
  { id:'panel',     left:'10%', top:'62%' },
  { id:'lcd',       left:'22%', top:'47%' },
  { id:'rfid',      left:'33%', top:'47%' },
  { id:'mcu',       left:'48%', top:'43%' },
  { id:'wires',     left:'61%', top:'33%' },
  { id:'battery',   left:'70%', top:'42%' },
  { id:'enclosure', left:'87%', top:'30%' },
  { id:'card',      left:'47%', top:'74%' },
  { id:'fob',       left:'60%', top:'79%' },
];

function Explorer(){
  const [active, setActive] = React.useState(null);
  const stageRef = React.useRef(null);

  const step = (delta) => {
    if (!active) { setActive(ORDER[0]); return; }
    const i = ORDER.indexOf(active);
    setActive(ORDER[(i + delta + ORDER.length) % ORDER.length]);
  };

  const c = active ? COMPONENTS[active] : null;
  const idx = active ? ORDER.indexOf(active) + 1 : 0;
  const activeHot = HOTSPOTS.find(h => h.id === active);

  return (
    <section className="section" id="components">
      <header className="section-head reveal">
        <span className="kicker">Inside the device</span>
        <h2 className="display-2">Nine parts. <em className="serif-italic">No mystery</em>.</h2>
        <p className="lede">Tap any pin. The component, the role it plays, and the spec.</p>
      </header>

      <div className="explorer">
        <div ref={stageRef} className={'explorer-stage' + (active ? ' has-active' : '')}>
          <img className="exploded" src="./exploded.png" alt="Exploded view of the Verigate device"/>
          {activeHot && <span className="spotlight" style={{left: activeHot.left, top: activeHot.top}}></span>}
          {HOTSPOTS.map(h => (
            <button key={h.id}
              className={'hot' + (active === h.id ? ' active' : '')}
              data-id={h.id}
              style={{left: h.left, top: h.top}}
              onClick={() => setActive(h.id)}
              aria-label={COMPONENTS[h.id].name}>
              <span className="hot-pin"></span>
              <span className="hot-label">{COMPONENTS[h.id].name}</span>
            </button>
          ))}
        </div>

        <aside className="explorer-panel">
          {!active && <div className="panel-default">
            <span className="panel-eyebrow">Pick a component</span>
            <h3>The whole device, demystified.</h3>
            <p className="panel-sub">Tap any pin on the diagram, or use the chips below. Arrow keys move between components, Esc clears.</p>
            <ul className="quick-rail">
              {ORDER.map(id => (
                <li key={id}><button className="qr" onClick={() => setActive(id)}>{COMPONENTS[id].name}</button></li>
              ))}
            </ul>
          </div>}
          {active && c && <div className="panel-detail">
            <span className="panel-eyebrow">{String(idx).padStart(2,'0')} / {String(ORDER.length).padStart(2,'0')} · Component</span>
            <h3>{c.name}</h3>
            <p className="panel-sub">{c.desc}</p>
            <div className="panel-block">
              <span className="block-label">Role</span>
              <p>{c.role}</p>
            </div>
            <ul className="spec-list">
              {c.specs.map(([k,v]) => <li key={k}><b>{k}</b><span>{v}</span></li>)}
            </ul>
            <div className="panel-controls">
              <button className="mini" onClick={() => step(-1)}>← Prev</button>
              <button className="mini" onClick={() => step(+1)}>Next →</button>
              <button className="mini close" onClick={() => setActive(null)}>Close</button>
            </div>
          </div>}
        </aside>
      </div>

      <style>{`
        .display-2{ font-family: var(--font-display); font-weight: 600; font-size: clamp(32px, 4.8vw, 60px); line-height: 1.04; letter-spacing: -0.028em; margin: 14px 0 18px; color: var(--text); }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 1.06em; color: var(--accent); }
        .lede{ font-size: clamp(17px, 1.35vw, 20px); line-height: 1.6; color: var(--text-2); max-width: 60ch; }

        .explorer{ display:grid; grid-template-columns: 1.55fr 1fr; gap: 20px; align-items: stretch; }
        .explorer-stage{
          position:relative;
          border-radius: var(--r-xl);
          border:1px solid var(--line);
          background:
            radial-gradient(640px 320px at 50% 58%, rgba(124,138,255,.18), transparent 65%),
            linear-gradient(180deg, #0C0F1F, #060814);
          overflow:hidden;
          aspect-ratio: 666 / 375;
          min-height: 360px;
          isolation: isolate;
          box-shadow: var(--shadow-md);
        }
        .exploded{ position:absolute; inset:0; width:100%; height:100%; object-fit: contain; transition: opacity .35s ease; }
        .explorer-stage.has-active .exploded{ opacity:.35; }
        .hot{ position:absolute; width:44px; height:44px; border-radius:50%; transform: translate(-50%,-50%); padding:0; outline:none; z-index:4; display:flex; align-items:center; justify-content:center; transition: transform .25s var(--easing-out), filter .25s ease; }
        .hot-pin{
          position: relative;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: linear-gradient(180deg, #fff 0%, var(--accent-2) 100%);
          box-shadow:
            0 0 0 4px rgba(124,138,255,.18),
            0 0 14px rgba(167,139,250,.7),
            0 2px 6px rgba(0,0,0,.4);
          transition: transform .25s var(--easing-out), box-shadow .25s ease;
        }
        .hot-pin::before{ content:""; position:absolute; inset:-6px; border-radius:50%; border:1px solid rgba(124,138,255,.55); opacity:0; transition: opacity .25s ease; }
        .hot.active .hot-pin{
          transform: scale(1.25);
          background: linear-gradient(180deg, #fff, var(--accent));
          box-shadow:
            0 0 0 6px rgba(124,138,255,.22),
            0 0 22px rgba(167,139,250,.95),
            0 2px 6px rgba(0,0,0,.5);
        }
        .hot.active .hot-pin::before{ opacity:1; animation: hotPulse 2s ease-out infinite; }
        @keyframes hotPulse{ 0%{ transform: scale(.7); opacity:.9; } 100%{ transform: scale(2.4); opacity:0; } }
        .hot:hover .hot-pin{ transform: scale(1.18); }
        .explorer-stage.has-active .hot:not(.active){ opacity:.45; }
        .hot-label{
          position:absolute; bottom: calc(100% + 2px); left: 50%;
          transform: translate(-50%, 6px); white-space: nowrap;
          font: 600 11px/1 var(--font-mono);
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--text);
          padding: 6px 9px;
          border-radius: 999px;
          border: 1px solid var(--line-2);
          background: rgba(20,23,43,.92);
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow-md);
          opacity:0; pointer-events: none;
          transition: opacity .2s ease, transform .25s var(--easing-out);
        }
        .hot:hover .hot-label, .hot.active .hot-label{ opacity:1; transform: translate(-50%, 0); }
        .spotlight{
          position:absolute; pointer-events:none; z-index:3;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(closest-side, rgba(124,138,255,.22), transparent 72%);
          border:1px dashed rgba(167,139,250,.5);
          transform: translate(-50%,-50%);
        }

        .explorer-panel{
          position: relative;
          border-radius: var(--r-xl);
          border:1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(8px);
          padding: 30px;
          display:flex; flex-direction:column; gap: 12px;
          min-height: 480px;
          box-shadow: var(--shadow-md);
        }
        .panel-eyebrow{
          font: 600 11px/1 var(--font-mono);
          letter-spacing:.22em; text-transform:uppercase;
          color: var(--accent);
          display:inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--line-3);
          background: rgba(124,138,255,.06);
          width: max-content;
        }
        .explorer-panel h3{ margin: 12px 0 4px; font-family: var(--font-display); font-size: clamp(22px, 2vw, 28px); line-height: 1.15; letter-spacing: -0.018em; color: var(--text); }
        .panel-sub{ color: var(--text-2); margin: 6px 0 14px; line-height: 1.6; }
        .panel-block{
          border:1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          background: var(--surface-2);
          margin-bottom: 14px;
        }
        .block-label{ font: 600 10.5px/1 var(--font-mono); letter-spacing:.18em; text-transform:uppercase; color: var(--muted); display:block; margin-bottom: 6px; }
        .panel-block p{ margin:0; color: var(--text-2); font-size: 14.5px; line-height: 1.55; }
        .spec-list{ list-style:none; margin:0 0 12px; padding:0; display:grid; gap:8px; }
        .spec-list li{
          display:flex; justify-content:space-between; gap:14px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--surface-2);
          border:1px solid var(--line);
          font-size: 13.5px;
          color: var(--text);
        }
        .spec-list li b{ font: 600 10.5px/1 var(--font-mono); letter-spacing:.18em; text-transform:uppercase; color: var(--muted); font-weight:600; }
        .quick-rail{ list-style:none; padding:0; margin: 18px 0 0; display:flex; flex-wrap:wrap; gap: 6px; }
        .qr{
          font: 600 11px/1 var(--font-mono);
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--muted);
          padding: 8px 11px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--surface-2);
          cursor: pointer;
          transition: all .2s var(--easing);
        }
        .qr:hover{
          color: var(--accent);
          border-color: var(--line-3);
          background: rgba(124,138,255,.06);
        }
        .panel-controls{ margin-top:auto; display:flex; gap:8px; }
        .mini{
          padding:10px 14px;
          border-radius: 999px;
          border:1px solid var(--line-2);
          color: var(--text);
          background: var(--surface);
          font-size: 13px;
          transition: all .2s var(--easing);
          cursor: pointer;
        }
        .mini:hover{
          background: var(--surface-2);
          border-color: var(--line-3);
          color: var(--accent);
        }
        .mini.close{ margin-left:auto; }
        @media (max-width: 980px){ .explorer{ grid-template-columns: 1fr; } .explorer-stage{ min-height: 320px; } }
      `}</style>
    </section>
  );
}

window.Explorer = Explorer;
