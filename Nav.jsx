/* Sticky pill nav â€” light theme. Frosted-white pill with crimson CTA. */
const NAV_LINKS = [
  { label: 'Product',    href: '#product' },
  { label: 'Process',    href: '#process' },
  { label: 'Inside',     href: '#build' },
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
      <span className="nav-spacer" aria-hidden="true"></span>   {/* 24.11.2026: the only LinkedIn button is at the end */}
      <style>{`
        /* 24.11.2026: a full-width bar with one hairline under it (was a floating pill) */
        .kit-nav{
          --gut: max(28px, calc((100vw - 1240px) / 2));
          position: sticky; top: 0; z-index: 50;
          margin: 0; width: 100%;
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
          gap: 24px;
          padding: calc(16px + env(safe-area-inset-top, 0px)) calc(var(--gut) + env(safe-area-inset-right, 0px)) 16px calc(var(--gut) + env(safe-area-inset-left, 0px));
          border: 0; border-bottom: 1px solid rgba(255,255,255,.07);
          border-radius: 0;
          background: transparent;
          transition: padding .35s var(--easing-out), background .35s var(--easing-out), border-color .35s var(--easing-out);
        }
        .kit-nav.scrolled{
          padding-top: calc(10px + env(safe-area-inset-top, 0px)); padding-bottom: 10px;
          border-bottom-color: rgba(255,255,255,.1);
        }
        .kit-nav .nav-cta{ justify-self: end; }
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
          width: 40px; height: 40px;
          object-fit: contain;
          /* Phoenix-tinted glow — warm gold inner, cool violet outer.
             The PNG is now transparent so the glow reads as light
             radiating from the logo itself, not a colored square. */
          transition: transform .25s var(--easing-spring), filter .25s var(--easing);
          filter:
            drop-shadow(0 0 6px rgba(240,179,117,.30))
            drop-shadow(0 2px 8px rgba(124,138,255,.22));
        }
        @media (hover:hover) and (pointer:fine){.brand:hover .brand-mark{
          transform: rotate(-4deg) scale(1.05);
          filter:
            drop-shadow(0 0 10px rgba(240,179,117,.45))
            drop-shadow(0 2px 10px rgba(124,138,255,.30));
        }}
        .brand-text{
          font-size: 19px; letter-spacing: -.01em;
          color: var(--text);
        }
        .nav-links{ display:flex; gap: clamp(8px, 2vw, 32px); }
        .nav-links a{
          position: relative;
          padding: 10px 4px; font-size: 15px;
          color: var(--text-2);
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
        @media (hover:hover) and (pointer:fine){.nav-links a:hover{ color: var(--text); }}
        @media (hover:hover) and (pointer:fine){.nav-links a:hover::after{
          transform: translateX(-50%) scaleX(1);
          box-shadow: 0 0 10px rgba(124,138,255,.55);
        }}
        .nav-cta{
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 20px 12px 18px;
          border-radius:999px; font-size:15px;
          background: linear-gradient(180deg, #B3BFFF, #6E7CF5);
          color:#06091A; font-weight:600;
          box-shadow: var(--glow-accent), inset 0 1px 0 rgba(255,255,255,.4);
          transition: transform .25s var(--easing-spring), box-shadow .25s var(--easing);
        }
        .nav-cta svg{ display:block; }
        @media (hover:hover) and (pointer:fine){.nav-cta:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 48px rgba(124,138,255,.55), inset 0 1px 0 rgba(255,255,255,.5);
        }}
        @media (max-width: 980px){
          .nav-links{ display:none; }
          .kit-nav{ grid-template-columns: 1fr auto; --gut: 20px; }
        }
        @media (max-width: 480px){
          .nav-cta{ padding: 10px 14px; gap: 6px; font-size: 14px; }
          .brand-mark{ width: 34px; height: 34px; }
          .brand-text{ font-size: 17px; }
        }
      `}</style>
    </nav>
  );
}

window.Nav = Nav;
