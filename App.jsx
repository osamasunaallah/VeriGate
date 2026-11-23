/* App — mounts every section in page order. */
function App(){
  // PhoenixIntro: mounted once; unmounts itself after its onDone fires.
  // The intro internally handles its own gating (sessionStorage +
  // prefers-reduced-motion + Three.js failure -> fallback).
  const [introMounted, setIntroMounted] = React.useState(true);
  // Bumped each time the nav logo is clicked. Used as React `key` so the
  // PhoenixIntro component is fully unmounted-then-remounted (fresh state,
  // fresh effect, fresh GLB animation timeline).
  const [introKey, setIntroKey]         = React.useState(0);

  // smooth wheel scrolling (Lenis); touch keeps the phone's own scrolling
  React.useEffect(() => {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !window.Lenis) return undefined;
    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1.25 });
    window.__lenis = lenis;
    let raf = 0;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onClick = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: id === '#product' ? 0 : -70, duration: 1.6 });
    };
    document.addEventListener('click', onClick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('click', onClick); lenis.destroy(); window.__lenis = null; };
  }, []);

  React.useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Nav logo click -> replay the cinematic intro. The handler in Nav.jsx
  // has already cleared sessionStorage + the running guard before
  // dispatching this event, so the new PhoenixIntro instance runs cleanly.
  React.useEffect(() => {
    const onReplay = () => {
      setIntroKey(k => k + 1);
      setIntroMounted(true);
    };
    window.addEventListener('verigate-replay-intro', onReplay);
    return () => window.removeEventListener('verigate-replay-intro', onReplay);
  }, []);

  return (
    <>
      {introMounted && <PhoenixIntro key={introKey} onDone={() => setIntroMounted(false)} />}
      <DeviceTour />
      <Nav />
      <main>
        {/* 23.11.2026: one pinned story with the 3D device beside short chapters,
            then the process animation and the contact card */}
        <Story />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
// Babel-standalone can re-evaluate inline scripts; guard so the root mounts once.
if (!window.__verigateRoot){
  window.__verigateRoot = ReactDOM.createRoot(document.getElementById('root'));
  window.__verigateRoot.render(<App />);
}
