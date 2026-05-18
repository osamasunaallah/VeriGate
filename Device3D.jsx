/* Device3D — CSS 3D model of the Verigate scan device.
   Six faces in real 3D space. Driven by --rx, --ry, --rz, --scale.

   Real-world proportions (from photos):
     width  : height : depth ≈ 1 : 1.15 : 0.55
   Rendered in px:
     width  = 240
     height = 280
     depth  = 130

   Faces are designed to match the photos:
     FRONT  : matte black, LCD bezel upper-third, raised SCAN text lower-third
     BACK   : flat matte black (no labels)
     LEFT   : flat matte black
     RIGHT  : flat matte black with small rocker switch near top
     TOP    : textured/granular matte (rougher than the sides)
     BOTTOM : flat matte black with subtle feet

   Props:
     id           — DOM id for this device
     interactive  — enable drag-to-rotate
     showCard     — show the floating RFID card (default false)
     lcdLine1     — top LCD line text
     lcdLine2     — bottom LCD line text
     screenState  — 'idle' (blue) | 'approved' (green)
*/

const DEVICE_W = 240;
const DEVICE_H = 280;
const DEVICE_D = 130;

function Device3D({
  id = 'device3d',
  className = '',
  interactive = false,
  showCard = false,
  lcdLine1 = 'VERIGATE',
  lcdLine2 = 'READY · SCAN',
  screenState = 'idle'
}){
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!interactive || !wrapRef.current) return;
    const el = wrapRef.current;
    let dragging = false;
    let startX = 0, startY = 0;
    let baseRY = 0, baseRX = 0;
    const readVar = (n) => parseFloat(getComputedStyle(el).getPropertyValue(n)) || 0;
    const down = (e) => {
      dragging = true;
      const p = e.touches ? e.touches[0] : e;
      startX = p.clientX; startY = p.clientY;
      baseRY = readVar('--ry');
      baseRX = readVar('--rx');
      el.classList.add('is-dragging');
    };
    const move = (e) => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      el.style.setProperty('--ry', (baseRY + (p.clientX - startX) * 0.5) + 'deg');
      el.style.setProperty('--rx', Math.max(-30, Math.min(30, baseRX - (p.clientY - startY) * 0.3)) + 'deg');
    };
    const up = () => { dragging = false; el.classList.remove('is-dragging'); };
    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    el.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    return () => {
      el.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      el.removeEventListener('touchstart', down);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [interactive]);

  const screenClass = screenState === 'approved' ? 'd3d-lcd-screen is-approved' : 'd3d-lcd-screen';

  return (
    <div ref={wrapRef} id={id} className={'d3d-wrap ' + className} style={{cursor: interactive ? 'grab' : 'default'}}>
      <div className="d3d-stage">
        <div className="d3d-floor"></div>
        <div className="d3d-model">
          {/* FRONT */}
          <div className="d3d-face d3d-front">
            <div className="d3d-front-bg"></div>
            <div className="d3d-lcd-housing">
              <div className="d3d-lcd-frame"></div>
              <div className={screenClass}>
                <div className="d3d-lcd-text">{lcdLine1}<span className="d3d-blink">_</span></div>
                <div className="d3d-lcd-text d3d-lcd-line2">{lcdLine2}</div>
                <div className="d3d-lcd-scan"></div>
              </div>
            </div>
            <div className="d3d-scan-text">Scan</div>
          </div>

          {/* BACK — flat matte black */}
          <div className="d3d-face d3d-back">
            <div className="d3d-back-bg"></div>
          </div>

          {/* RIGHT — flat with rocker switch near top-front */}
          <div className="d3d-face d3d-right">
            <div className="d3d-side-bg"></div>
            <div className="d3d-rocker">
              <div className="d3d-rocker-base"></div>
              <div className="d3d-rocker-toggle">
                <span className="d3d-rocker-dimple"></span>
              </div>
            </div>
          </div>

          {/* LEFT — flat matte black */}
          <div className="d3d-face d3d-left">
            <div className="d3d-side-bg"></div>
          </div>

          {/* TOP — textured matte (granular) */}
          <div className="d3d-face d3d-top">
            <div className="d3d-top-bg"></div>
          </div>

          {/* BOTTOM */}
          <div className="d3d-face d3d-bottom">
            <div className="d3d-bottom-bg"></div>
            <div className="d3d-foot d3d-foot-tl"></div>
            <div className="d3d-foot d3d-foot-tr"></div>
            <div className="d3d-foot d3d-foot-bl"></div>
            <div className="d3d-foot d3d-foot-br"></div>
          </div>
        </div>

        {/* Floating RFID card (optional, defaults to hidden) */}
        {showCard && (
          <div className="d3d-card">
            <div className="d3d-card-face">
              <span className="d3d-card-chip"></span>
              <span className="d3d-card-wave"><i></i><i></i><i></i></span>
              <span className="d3d-card-label">DRIVER · 0241</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .d3d-wrap{
          --rx: -8deg;
          --ry: -28deg;
          --rz: 0deg;
          --scale: 1;
          --w: ${DEVICE_W}px;
          --h: ${DEVICE_H}px;
          --d: ${DEVICE_D}px;
          position: relative;
          width: 100%;
          height: 100%;
          perspective: 2400px;
          perspective-origin: 50% 42%;
          user-select: none;
          -webkit-user-select: none;
        }
        .d3d-stage{
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          transform-style: preserve-3d;
        }
        .d3d-floor{
          position:absolute; left:50%; bottom: 14%;
          width: calc(var(--w) * 1.8 * var(--scale));
          height: calc(var(--w) * 0.55 * var(--scale));
          transform: translate(-50%, 0) rotateX(80deg);
          background: radial-gradient(closest-side, rgba(0,0,0,.85), transparent 70%);
          filter: blur(22px);
          opacity: .9;
        }
        .d3d-model{
          position: relative;
          width: var(--w); height: var(--h);
          transform-style: preserve-3d;
          transform:
            scale(var(--scale))
            rotateX(var(--rx))
            rotateY(var(--ry))
            rotateZ(var(--rz));
          transition: transform .35s cubic-bezier(.22,.61,.36,1);
          animation: d3dFloat 7s ease-in-out infinite;
          will-change: transform;
        }
        .is-dragging .d3d-model{ transition: none; animation: none; }
        @keyframes d3dFloat{
          0%, 100%{ filter: drop-shadow(0 30px 30px rgba(0,0,0,.5)); }
          50%{ filter: drop-shadow(0 50px 60px rgba(0,0,0,.6)); }
        }

        .d3d-face{
          position: absolute;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
          transform-style: flat;
        }
        .d3d-face > *{
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        /* ====== FRONT ====== */
        .d3d-front{
          width: var(--w); height: var(--h);
          left: 0; top: 0;
          transform: translateZ(calc(var(--d) / 2));
        }
        .d3d-front-bg{
          position:absolute; inset:0;
          background:
            linear-gradient(180deg, #16181c 0%, #0c0e11 30%, #07090c 70%, #15181c 100%);
        }
        .d3d-front-bg::before{
          /* Plastic micro-grain */
          content:""; position:absolute; inset:0;
          background-image:
            radial-gradient(.8px .8px at 14% 22%, rgba(255,255,255,.05) 50%, transparent 51%),
            radial-gradient(1px 1px at 38% 64%, rgba(255,255,255,.04) 50%, transparent 51%),
            radial-gradient(.8px .8px at 70% 28%, rgba(255,255,255,.05) 50%, transparent 51%),
            radial-gradient(1px 1px at 84% 78%, rgba(255,255,255,.035) 50%, transparent 51%),
            radial-gradient(.8px .8px at 22% 88%, rgba(255,255,255,.04) 50%, transparent 51%);
          background-size: 5px 5px, 7px 7px, 6px 6px, 8px 8px, 5px 5px;
          mix-blend-mode: screen;
          opacity: .85;
        }
        .d3d-front-bg::after{
          /* Sheen / lighting */
          content:""; position:absolute; inset:0;
          background: linear-gradient(125deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,.4) 100%);
          pointer-events:none;
        }

        /* LCD Housing */
        .d3d-lcd-housing{
          position:absolute;
          left: 9%; right: 9%;
          top: 18%;
          height: 18%;
        }
        .d3d-lcd-frame{
          position:absolute; inset:0;
          background: linear-gradient(180deg, #0a0a0c 0%, #050507 100%);
          border: 1px solid rgba(0,0,0,.95);
          border-radius: 3px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.08),
            inset 0 -1px 0 rgba(0,0,0,.85),
            inset 0 0 12px rgba(0,0,0,.85),
            0 2px 0 rgba(0,0,0,.6);
        }
        .d3d-lcd-screen{
          position:absolute;
          inset: 12% 8%;
          background:
            linear-gradient(180deg, #1f3f9e 0%, #142a72 50%, #0c1e5a 100%);
          border-radius: 1px;
          box-shadow:
            inset 0 0 0 1px rgba(0,0,0,.85),
            inset 0 0 18px rgba(0,0,0,.55),
            inset 0 0 30px rgba(60,100,220,.5),
            0 0 18px rgba(40,80,200,.4);
          overflow: hidden;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 0 8px;
          transition: background .8s ease, box-shadow .8s ease;
        }
        /* Approved/green-screen state */
        .d3d-lcd-screen.is-approved{
          background:
            linear-gradient(180deg, #1aa05a 0%, #0d6e3a 50%, #094a27 100%);
          box-shadow:
            inset 0 0 0 1px rgba(0,0,0,.85),
            inset 0 0 18px rgba(0,0,0,.55),
            inset 0 0 30px rgba(60,220,140,.55),
            0 0 22px rgba(40,200,120,.55);
        }
        .d3d-lcd-screen.is-approved .d3d-lcd-text{
          color: #D7FFE6;
          text-shadow: 0 0 7px rgba(170, 255, 200, .9), 0 0 1px rgba(255,255,255,.85);
        }
        .d3d-lcd-screen.is-approved .d3d-lcd-line2{
          color: #B3F5CC;
        }
        .d3d-lcd-screen.is-approved .d3d-lcd-scan{
          background: linear-gradient(180deg, transparent, rgba(170, 255, 200, .25), transparent);
        }

        .d3d-lcd-screen::before{
          /* Pixel grid */
          content:""; position:absolute; inset:0;
          background:
            repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0 1px, transparent 1px 4px),
            repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 1px, transparent 1px 4px);
          pointer-events:none;
        }
        .d3d-lcd-text{
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: .14em;
          color: #C2D6FF;
          text-shadow: 0 0 7px rgba(170, 210, 255, .9), 0 0 1px rgba(255,255,255,.85);
          line-height: 1.35;
          z-index: 2;
          transition: color .8s ease, text-shadow .8s ease;
        }
        .d3d-lcd-line2{ color: #95B6F0; font-size: 11px; opacity: .9; }
        .d3d-blink{ animation: d3dBlink 1s steps(2) infinite; }
        @keyframes d3dBlink{ 50%{ opacity: 0; } }
        .d3d-lcd-scan{
          position: absolute; left: 0; right: 0;
          height: 28%;
          background: linear-gradient(180deg, transparent, rgba(170, 210, 255, .22), transparent);
          animation: d3dScan 3.6s linear infinite;
          pointer-events: none;
          z-index: 1;
          transition: background .8s ease;
        }
        @keyframes d3dScan{ 0%{ top: -28%; } 100%{ top: 110%; } }

        /* SCAN raised text — closer to the LCD, refined serif italic */
        .d3d-scan-text{
          position: absolute;
          left: 0; right: 0;
          top: 42%;
          text-align: center;
          font-family: 'Instrument Serif', serif;
          font-style: italic;
          font-weight: 400;
          font-size: 46px;
          letter-spacing: 0.005em;
          color: #f6f7fa;
          text-shadow:
            0 1px 0 rgba(255,255,255,.28),
            0 -1px 0 rgba(0,0,0,.6),
            0 2px 4px rgba(0,0,0,.7),
            0 4px 8px rgba(0,0,0,.4);
          -webkit-text-stroke: 0.3px rgba(255,255,255,.45);
        }

        /* ====== BACK — flat matte black ====== */
        .d3d-back{
          width: var(--w); height: var(--h);
          left: 0; top: 0;
          transform: translateZ(calc(var(--d) / -2)) rotateY(180deg);
        }
        .d3d-back-bg{
          position:absolute; inset:0;
          background: linear-gradient(180deg, #15181c 0%, #0a0c0f 50%, #15181c 100%);
        }
        .d3d-back-bg::before{
          content:""; position:absolute; inset:0;
          background-image:
            radial-gradient(.8px .8px at 18% 22%, rgba(255,255,255,.04) 50%, transparent 51%),
            radial-gradient(.8px .8px at 48% 54%, rgba(255,255,255,.035) 50%, transparent 51%),
            radial-gradient(.8px .8px at 78% 32%, rgba(255,255,255,.04) 50%, transparent 51%),
            radial-gradient(.8px .8px at 28% 78%, rgba(255,255,255,.035) 50%, transparent 51%);
          background-size: 6px 6px, 7px 7px, 5px 5px, 8px 8px;
          mix-blend-mode: screen;
        }
        .d3d-back-bg::after{
          content:""; position:absolute; inset:0;
          background: linear-gradient(245deg, rgba(255,255,255,.06) 0%, rgba(0,0,0,.35) 100%);
        }

        /* ====== RIGHT (rocker switch near top-front edge) ====== */
        .d3d-right{
          width: var(--d); height: var(--h);
          left: calc((var(--w) - var(--d)) / 2); top: 0;
          transform:
            translateX(calc((var(--w) - var(--d)) / -2))
            translateX(calc(var(--w) / 2))
            rotateY(90deg)
            translateZ(calc(var(--d) / 2));
        }
        .d3d-side-bg{
          position:absolute; inset:0;
          background: linear-gradient(180deg, #15181c 0%, #0a0c0f 50%, #14171b 100%);
        }
        .d3d-side-bg::before{
          content:""; position:absolute; inset:0;
          background-image:
            radial-gradient(.8px .8px at 22% 22%, rgba(255,255,255,.04) 50%, transparent 51%),
            radial-gradient(.8px .8px at 58% 54%, rgba(255,255,255,.035) 50%, transparent 51%),
            radial-gradient(.8px .8px at 78% 78%, rgba(255,255,255,.04) 50%, transparent 51%);
          background-size: 6px 6px, 7px 7px, 5px 5px;
          mix-blend-mode: screen;
        }
        .d3d-side-bg::after{
          content:""; position:absolute; inset:0;
          background: linear-gradient(95deg, rgba(255,255,255,.08) 0%, transparent 30%, rgba(0,0,0,.4) 100%);
        }
        /* Rocker — small, near top-front */
        .d3d-rocker{
          position:absolute;
          right: 18%;
          top: 22%;
          width: 28px; height: 18px;
        }
        .d3d-rocker-base{
          position:absolute; inset:0;
          background: linear-gradient(180deg, #050505, #0c0c0c);
          border: 1px solid rgba(0,0,0,.95);
          border-radius: 2px;
          box-shadow: inset 0 0 6px rgba(0,0,0,.95), 0 1px 2px rgba(255,255,255,.06);
        }
        .d3d-rocker-toggle{
          position:absolute; inset: 3px;
          background: linear-gradient(180deg, #1c1c1c 0%, #0e0e0e 50%, #1a1a1a 100%);
          border-radius: 1px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.8);
          display: flex; align-items: center; justify-content: center;
        }
        .d3d-rocker-dimple{
          width: 4px; height: 4px;
          border-radius: 50%;
          background: rgba(0,0,0,.7);
          box-shadow: 0 1px 0 rgba(255,255,255,.06);
        }

        /* ====== LEFT — flat matte black ====== */
        .d3d-left{
          width: var(--d); height: var(--h);
          left: calc((var(--w) - var(--d)) / 2); top: 0;
          transform:
            translateX(calc((var(--w) - var(--d)) / -2))
            translateX(calc(var(--w) / -2))
            rotateY(-90deg)
            translateZ(calc(var(--d) / 2));
        }

        /* ====== TOP (textured granular matte) ====== */
        .d3d-top{
          width: var(--w); height: var(--d);
          left: 0; top: calc((var(--h) - var(--d)) / 2);
          transform:
            translateY(calc((var(--h) - var(--d)) / -2))
            translateY(calc(var(--h) / -2))
            rotateX(90deg)
            translateZ(calc(var(--d) / 2));
        }
        .d3d-top-bg{
          position:absolute; inset:0;
          background: radial-gradient(140% 100% at 30% 30%, #1f2227 0%, #0a0b0d 75%);
        }
        .d3d-top-bg::before{
          /* Heavy granular texture */
          content:""; position:absolute; inset:0;
          background-image:
            radial-gradient(1.4px 1.4px at 8% 12%, rgba(255,255,255,.12) 50%, transparent 51%),
            radial-gradient(1.2px 1.2px at 22% 38%, rgba(255,255,255,.10) 50%, transparent 51%),
            radial-gradient(1px 1px at 38% 18%, rgba(255,255,255,.09) 50%, transparent 51%),
            radial-gradient(1.4px 1.4px at 52% 52%, rgba(255,255,255,.11) 50%, transparent 51%),
            radial-gradient(1px 1px at 66% 28%, rgba(255,255,255,.09) 50%, transparent 51%),
            radial-gradient(1.2px 1.2px at 78% 64%, rgba(255,255,255,.10) 50%, transparent 51%),
            radial-gradient(1px 1px at 88% 36%, rgba(255,255,255,.09) 50%, transparent 51%),
            radial-gradient(1.2px 1.2px at 14% 72%, rgba(255,255,255,.10) 50%, transparent 51%),
            radial-gradient(1.4px 1.4px at 42% 86%, rgba(255,255,255,.11) 50%, transparent 51%),
            radial-gradient(1px 1px at 64% 92%, rgba(255,255,255,.09) 50%, transparent 51%),
            radial-gradient(1.2px 1.2px at 86% 84%, rgba(255,255,255,.10) 50%, transparent 51%);
          background-size: 4px 4px, 5px 5px, 6px 6px, 4px 4px, 7px 7px, 5px 5px, 6px 6px, 4px 4px, 5px 5px, 6px 6px, 4px 4px;
          mix-blend-mode: screen;
        }
        .d3d-top-bg::after{
          content:""; position:absolute; inset:0;
          background: linear-gradient(195deg, rgba(255,255,255,.08) 0%, rgba(0,0,0,.25) 100%);
        }

        /* ====== BOTTOM ====== */
        .d3d-bottom{
          width: var(--w); height: var(--d);
          left: 0; top: calc((var(--h) - var(--d)) / 2);
          transform:
            translateY(calc((var(--h) - var(--d)) / -2))
            translateY(calc(var(--h) / 2))
            rotateX(-90deg)
            translateZ(calc(var(--d) / 2));
        }
        .d3d-bottom-bg{
          position:absolute; inset:0;
          background: linear-gradient(180deg, #0a0c0f, #050608);
        }
        .d3d-foot{
          position:absolute;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: radial-gradient(closest-side, #1a1a1a, #050505);
          box-shadow: inset 0 1px 1px rgba(255,255,255,.06);
        }
        .d3d-foot-tl{ left: 8%; top: 14%; }
        .d3d-foot-tr{ right: 8%; top: 14%; }
        .d3d-foot-bl{ left: 8%; bottom: 14%; }
        .d3d-foot-br{ right: 8%; bottom: 14%; }

        /* ====== Floating RFID card ====== */
        .d3d-card{
          position: absolute;
          width: 130px; height: 82px;
          left: calc(50% + var(--w) * 0.5 * var(--scale));
          top: calc(50% + var(--h) * 0.05 * var(--scale));
          transform-style: preserve-3d;
          transform:
            translate(-50%, -50%)
            scale(var(--scale))
            rotateY(calc(-30deg + var(--ry) * .2))
            rotateX(calc(10deg + var(--rx) * .2))
            rotateZ(-12deg);
          animation: d3dCardFloat 4s ease-in-out infinite;
        }
        @keyframes d3dCardFloat{
          0%, 100%{ filter: drop-shadow(0 12px 14px rgba(0,0,0,.5)); }
          50%{ filter: drop-shadow(0 18px 26px rgba(91,140,255,.4)); }
        }
        .d3d-card-face{
          width:100%; height:100%;
          border-radius: 10px;
          background: linear-gradient(135deg, #5B8CFF 0%, #2D4FCF 60%, #1F3A9A 100%);
          position:relative;
          overflow:hidden;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.4),
            inset 0 -1px 0 rgba(0,0,0,.3),
            0 6px 22px rgba(91,140,255,.45);
          padding: 10px 12px;
          color: #fff;
          font-family: 'JetBrains Mono', monospace;
        }
        .d3d-card-face::before{
          content:""; position:absolute; inset:0;
          background: linear-gradient(115deg, rgba(255,255,255,.25) 0%, transparent 40%, rgba(0,0,0,.15) 100%);
        }
        .d3d-card-chip{
          position:absolute; top: 12px; left: 12px;
          width: 22px; height: 17px;
          border-radius: 3px;
          background: linear-gradient(135deg, #f5d97a, #b8941e);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.3);
        }
        .d3d-card-chip::after{
          content:""; position:absolute; inset: 2px;
          background-image:
            linear-gradient(90deg, transparent 30%, rgba(0,0,0,.4) 30%, rgba(0,0,0,.4) 32%, transparent 32%, transparent 50%, rgba(0,0,0,.4) 50%, rgba(0,0,0,.4) 52%, transparent 52%, transparent 70%, rgba(0,0,0,.4) 70%, rgba(0,0,0,.4) 72%, transparent 72%),
            linear-gradient(0deg, transparent 30%, rgba(0,0,0,.4) 30%, rgba(0,0,0,.4) 32%, transparent 32%, transparent 70%, rgba(0,0,0,.4) 70%, rgba(0,0,0,.4) 72%, transparent 72%);
        }
        .d3d-card-wave{
          position:absolute; top: 10px; right: 10px;
          width: 22px; height: 22px;
        }
        .d3d-card-wave i{
          position:absolute; top:50%; right: 0;
          width: 100%; height: 100%;
          border: 1.5px solid rgba(255,255,255,.85);
          border-color: transparent rgba(255,255,255,.85) transparent transparent;
          border-radius: 50%;
          transform: translateY(-50%);
          animation: d3dWave 1.6s ease-out infinite;
          opacity: 0;
        }
        .d3d-card-wave i:nth-child(1){ animation-delay: 0s; }
        .d3d-card-wave i:nth-child(2){ animation-delay: .35s; }
        .d3d-card-wave i:nth-child(3){ animation-delay: .7s; }
        @keyframes d3dWave{
          0%{ transform: translateY(-50%) scale(.4); opacity: 0; }
          30%{ opacity: 1; }
          100%{ transform: translateY(-50%) scale(1.2); opacity: 0; }
        }
        .d3d-card-label{
          position:absolute; bottom: 10px; left: 12px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .15em;
          color: rgba(255,255,255,.95);
          z-index: 1;
        }
      `}</style>
    </div>
  );
}

window.Device3D = Device3D;
