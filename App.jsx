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
      <Nav />
      <main>
        <HeroPhoto />
        <Architecture />
        <div className="div-glow" />
        <Capabilities />
        <Problems />
        <Solution />
        <Process />
        <Explorer />
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
