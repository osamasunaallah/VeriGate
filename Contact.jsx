/* Contact CTA card + footer — light theme. */
function Contact(){
  return (
    <section className="section contact" id="contact">
      <div className="contact-card reveal">
        <div className="contact-bloom" aria-hidden="true"></div>
        <div className="contact-grid" aria-hidden="true"></div>
        <span className="kicker"><span className="dot"></span>Get in touch</span>
        <h2 className="display-2">Every dock deserves <em className="serif-italic grad-text">a VeriGate</em>.</h2>
        <p className="lede center">Contact Owner for More Details.</p>
        <a
          href="https://www.linkedin.com/in/osamasunaallah/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn primary big contact-cta"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"/></svg>
          Connect on LinkedIn
          <svg className="contact-cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </div>
      <style>{`
        .contact{ padding-bottom: clamp(60px, 8vw, 110px); }
        .contact-card{
          position:relative; text-align:center;
          padding: clamp(48px, 7vw, 92px) clamp(24px, 4vw, 60px);
          border-radius: var(--r-2xl);
          border:1px solid var(--line);
          overflow:hidden;
          background:
            radial-gradient(900px 360px at 50% -20%, rgba(124,138,255,.30), transparent 60%),
            radial-gradient(900px 360px at 50% 120%, rgba(167,139,250,.22), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01)),
            var(--surface);
          backdrop-filter: blur(10px);
          box-shadow: var(--shadow-lg);
          display: flex; flex-direction: column; align-items: center;
        }
        .contact-bloom{
          position: absolute;
          left: 50%; top: 0;
          width: 640px; height: 640px;
          transform: translate(-50%, -55%);
          background: radial-gradient(closest-side, rgba(124,138,255,.32), transparent 70%);
          filter: blur(40px);
          pointer-events: none;
          animation: contactBloom 7s ease-in-out infinite;
        }
        @keyframes contactBloom{
          0%, 100%{ transform: translate(-50%, -55%) scale(1); opacity: .85; }
          50%{ transform: translate(-50%, -55%) scale(1.06); opacity: 1; }
        }
        .contact-grid{
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%);
          pointer-events: none;
        }
        .contact-card > *:not(.contact-bloom):not(.contact-grid){ position: relative; z-index: 1; }
        .contact-cta{ position: relative; }
        .contact-cta-arrow{ transition: transform .35s var(--easing-spring); margin-left: 2px; }
        .contact-cta:hover .contact-cta-arrow{ transform: translateX(5px); }
        .contact-card .kicker{
          display:inline-flex; align-items:center; gap:10px;
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .22em; text-transform: uppercase;
          color: var(--muted);
          padding: 8px 12px;
          border:1px solid var(--line);
          border-radius: 999px;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(8px);
          margin: 0 auto;
        }
        .contact-card .kicker .dot{
          width:8px; height:8px; border-radius:50%;
          background: var(--accent);
          box-shadow: 0 0 0 4px rgba(124,138,255,.14), 0 0 18px rgba(124,138,255,.7);
        }
        .display-2{
          font-family: var(--font-display); font-weight: 600;
          font-size: clamp(34px, 5.4vw, 72px);
          line-height: 1.02; letter-spacing: -0.032em;
          margin: 20px auto 28px;
          max-width: 22ch;
          color: var(--text);
          text-wrap: balance;
        }
        .display-2 em{ font-family: var(--font-serif); font-style: italic; font-weight: 400; font-size: 1.06em; color: var(--accent); }
        .display-2 em.grad-text{
          background: linear-gradient(180deg, #FFFFFF 0%, #C5CAF8 55%, #A78BFA 100%);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .lede.center{ margin: 0 auto 30px; text-align: center; max-width: 60ch; font-size: clamp(16px, 1.2vw, 19px); line-height: 1.6; color: var(--text-2); }
      `}</style>
    </section>
  );
}

window.Contact = Contact;
