/* Sticky pill nav â€” light theme. Frosted-white pill with crimson CTA. */
const NAV_LINKS = [
  { label: 'Product',    href: '#product' },
  { label: 'Process',    href: '#process' },
  { label: 'Components', href: '#components' },
  { label: 'Contact',    href: '#contact' },
];

function Nav(){
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Clicking the brand logo replays the cinematic phoenix intro. App listens
  // for this event and force-remounts PhoenixIntro with a fresh key. We clear
  // the session-played flag here so the intro's own gate doesn't short-circuit.
  const replayIntro = (e) => {
    e.preventDefault();
    try { sessionStorage.removeItem('verigate_intro_played'); } catch(_){}
    try { window.__phxIntroRunning = false; } catch(_){}
    window.dispatchEvent(new Event('verigate-replay-intro'));
  };

  return (
    <nav className={'kit-nav' + (scrolled ? ' scrolled' : '')}>
      <a
        href="#"
        className="brand"
        id="brand-logo-target"
        onClick={replayIntro}
        title="Replay phoenix intro"
        aria-label="Replay phoenix intro"
      >
        <img
          className="brand-mark"
          src="./verigate-logo.png?v=31"
          alt="Verigate phoenix logo"
          width="32" height="32"
          decoding="async"
        />
        <span className="brand-text">Verigate</span>
      </a>
      <div className="nav-links">
        {NAV_LINKS.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
      </div>
      <a
        href="https://www.linkedin.com/in/osamasunaallah/"
        target="_blank"
        rel="noopener noreferrer"
        className="nav-cta"
        aria-label="LinkedIn â€” Osama Sunaallah"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"/></svg>
        LinkedIn
      </a>
      <style>{`
        .kit-nav{
          position: sticky; top: 14px; z-index: 50;
          margin: 14px auto 0;
          width: min(1280px, calc(100% - 32px));
          display:flex; align-items:center; justify-content:space-between;
          gap: 24px;
          padding: 10px 14px 10px 18px;
          border:1px solid var(--line);
          background: rgba(20,23,43,.55);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border-radius: 999px;
          transition:
            padding .45s var(--easing-out),
            background .45s var(--easing-out),
            border-color .45s var(--easing-out),
            box-shadow .45s var(--easing-out);
          box-shadow: 0 10px 30px rgba(0,0,0,.25);
        }
        .kit-nav.scrolled{
          padding: 6px 10px 6px 14px;
          background: rgba(20,23,43,.78);
          border-color: var(--line-2);
          box-shadow: 0 18px 40px rgba(0,0,0,.4);
        }
        .brand{
          display:flex; align-items:center; gap:10px;
          font-family: var(--font-display); font-weight:600; min-width:0;
          cursor: pointer;
          user-select: none;
        }
        .brand:active{ transform: scale(.96); }
        .brand:active .brand-mark{ transform: rotate(-8deg) scale(.95); }
        .brand-mark{
          display: block;
          width: 32px; height: 32px;
          object-fit: contain;
          /* Phoenix-tinted glow — warm gold inner, cool violet outer.
             The PNG is now transparent so the glow reads as light
             radiating from the logo itself, not a colored square. */
          transition: transform .25s var(--easing-spring), filter .25s var(--easing);
          filter:
            drop-shadow(0 0 6px rgba(240,179,117,.30))
            drop-shadow(0 2px 8px rgba(124,138,255,.22));
        }
        .brand:hover .brand-mark{
          transform: rotate(-4deg) scale(1.05);
          filter:
            drop-shadow(0 0 10px rgba(240,179,117,.45))
            drop-shadow(0 2px 10px rgba(124,138,255,.30));
        }
        .brand-text{
          font-size: 15px; letter-spacing:.005em;
          color: var(--text);
        }
        .nav-links{ display:flex; gap:2px; }
        .nav-links a{
          position: relative;
          padding:9px 16px; border-radius:999px; font-size:14px;
          color: var(--muted);
          transition: color .25s var(--easing), background .25s var(--easing);
        }
        .nav-links a::after{
          content: "";
          position: absolute;
          left: 50%; bottom: 4px;
          transform: translateX(-50%) scaleX(0);
          width: 18px; height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          transition: transform .35s var(--easing-out), box-shadow .35s var(--easing-out);
        }
        .nav-links a:hover{ color: var(--text); background: rgba(255,255,255,.05); }
        .nav-links a:hover::after{
          transform: translateX(-50%) scaleX(1);
          box-shadow: 0 0 10px rgba(124,138,255,.55);
        }
        .nav-cta{
          display: inline-flex; align-items: center; gap: 8px;
          padding:9px 16px 9px 14px;
          border-radius:999px; font-size:14px;
          background: linear-gradient(180deg, #B3BFFF, #6E7CF5);
          color:#06091A; font-weight:600;
          box-shadow: var(--glow-accent), inset 0 1px 0 rgba(255,255,255,.4);
          transition: transform .25s var(--easing-spring), box-shadow .25s var(--easing);
        }
        .nav-cta svg{ display:block; }
        .nav-cta:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 48px rgba(124,138,255,.55), inset 0 1px 0 rgba(255,255,255,.5);
        }
        @media (max-width: 980px){
          .nav-links{ display:none; }
          .kit-nav{ width: min(720px, calc(100% - 20px)); padding: 8px 10px 8px 14px; }
        }
        @media (max-width: 480px){
          .nav-cta{ padding: 8px 12px; gap: 6px; }
        }
      `}</style>
    </nav>
  );
}

window.Nav = Nav;
