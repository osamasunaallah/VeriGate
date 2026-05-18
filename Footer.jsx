/* Footer — light theme. Brand mark + meta line. */
function Footer(){
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="footer-mark">
            <span className="footer-dot"></span>
            Verigate
          </span>
          <span className="footer-meta">IoT Receiving Device · One source of truth</span>
        </div>
        <div className="site-footer-meta">
          <span>© {year} Osama Sunaallah</span>
          <span className="footer-sep">·</span>
          <a href="https://www.linkedin.com/in/osamasunaallah/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <span className="footer-sep">·</span>
          <span className="footer-mono">v1.0 / shipped</span>
        </div>
      </div>

      <style>{`
        .site-footer{
          position: relative;
          z-index: 1;
          width: min(1280px, calc(100% - 40px));
          margin: clamp(60px, 10vw, 120px) auto 32px;
          padding: 28px 0 0;
          border-top: 1px solid var(--line);
        }
        .site-footer-inner{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .site-footer-brand{
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .footer-mark{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        .footer-dot{
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 3px rgba(124,138,255,.14), 0 0 12px rgba(124,138,255,.6);
          animation: footerPulse 2.6s ease-in-out infinite;
        }
        @keyframes footerPulse{ 50%{ box-shadow: 0 0 0 5px rgba(124,138,255,.05), 0 0 16px rgba(124,138,255,.85); } }
        .footer-meta{
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .site-footer-meta{
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font: 600 12px/1 var(--font-mono);
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .site-footer-meta a{
          color: var(--muted);
          transition: color .25s var(--easing);
        }
        .site-footer-meta a:hover{ color: var(--accent); }
        .footer-sep{ opacity: .4; }
        .footer-mono{
          color: var(--accent);
          opacity: .75;
        }
        @media (max-width: 720px){
          .site-footer-inner{ flex-direction: column; align-items: flex-start; }
          .footer-meta{ display: none; }
        }
      `}</style>
    </footer>
  );
}

window.Footer = Footer;
