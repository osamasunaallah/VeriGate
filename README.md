# Verigate — Phoenix

A premium one-page portfolio for the **Verigate IoT receiving device** — a 13.56 MHz RFID reader built on Arduino that verifies shipments at the gate. One tap, one verified shipment, one source of truth.

The site is a **no-build static site**: React 18 + Babel-standalone, Three.js loaded via ESM importmap, no package.json, no bundler. Drop the folder on any static host and it works.

---

## Run locally

```bash
# From the project folder
python -m http.server 5173
```

Open <http://localhost:5173>. Any static server works (`npx serve`, `php -S`, Live Server, etc.) — there is nothing to build.

## Deploy

Drop the entire folder on:

- **GitHub Pages** — push to a repo, enable Pages on the `main` branch, root.
- **Netlify / Vercel / Cloudflare Pages** — point at the folder, set publish dir to `/`, build command empty.
- **Any static host** — upload the files as-is.

No environment variables, no build step.

---

## Project structure

```
index.html              Entry point. Loads React + Babel-standalone +
                        Three.js (via importmap). Mounts <App>.
kit.css                 Page-level layout, sections, ambient backdrop.
colors_and_type.css     Design tokens — colors, type scale, shadows,
                        radii, motion easings. Imported by kit.css.

Nav.jsx                 Sticky pill navbar with the phoenix logo.
PhoenixIntro.jsx        One-shot cinematic intro: a 3D phoenix sweeps
                        across the screen on first visit.
HeroPhoto.jsx           Hero section with auto-cycling status chapters.
                        Drop-in hook for live device data — see below.
DeviceWithLCD.jsx       3D device with a dynamic LCD texture.
Hero3D.jsx, Device3D.jsx
                        Three.js helpers for the device renderers.
MarqueeStrip.jsx        Scrolling spec strip.
Architecture.jsx        System architecture diagram.
Capabilities.jsx        Four-card capabilities grid.
Problems.jsx            Pain points section.
Solution.jsx            Solution mockup with wallpaper image.
Process.jsx             Video walkthrough section.
Explorer.jsx            Interactive exploded view with hotspots.
Contact.jsx             Contact card.
Footer.jsx              Footer.

phoenix-bird.glb        3D model for the intro animation.
verigate-device.glb     3D model of the receiving device.
verigate-logo.png       Phoenix logo (transparent background).
product-clean.jpg       Favicon.
process-thumbnail.jpg   OG social image + video poster.
wallpaper.jpg           Background photo for the Solution section.
exploded.png            Exploded-view image for the Explorer section.
process.mp4             Process walkthrough video.
```

---

## Phoenix intro

The intro plays **once per browser session** on first visit, and replays whenever
the brand logo is clicked:

- A 3D phoenix flies across the screen below the navbar.
- Four distinct flight paths are pre-defined (L→R level, R→L level, L→R
  diagonal climb, R→L diagonal dive). One is picked at random per play,
  paired with a matching sub-clip of the GLB's `Take 001` animation so
  each play looks different.
- Head always leads the motion (rotation is computed from each path's
  direction; pitch tilts up on climbs, down on dives).
- After ~5.2 s the canvas fades out and the component unmounts entirely
  — the WebGL renderer is disposed and the RAF loop is cancelled.

### Force a replay

Click the brand logo in the nav, or append `?intro=1` to the URL.

### Accessibility

- Skipped under `prefers-reduced-motion: reduce`.
- If Three.js fails to load within 900 ms, a CSS-only fallback animates
  the logo image across the screen (transform + opacity only).

### Tuning

Open `PhoenixIntro.jsx`:

- `INTRO_DURATION_MS` — total flight time (default `5200`).
- `PATHS` array — `[startFrame, endFrame, startX, startY, endX, endY, rotY, label]`
  per path. Adjust start/end positions or add more entries to expand the
  random pool.
- `model.scale.setScalar(fit * 0.8)` — overall size multiplier.

---

## Live device status

`HeroPhoto.jsx` exports a `useStatusSource` hook with a 2 s demo cycle.
Replace its body with one of four documented recipes to wire it to a
real backend:

```jsx
function useStatusSource(setActive, chapterCount){
  React.useEffect(() => {
    // Recipe A — Firebase Realtime Database
    // const unsub = onValue(ref(db, 'device/status'), snap => {
    //   setActive(mapStatusToChapter(snap.val()));
    // });
    // return () => unsub();

    // Recipe B — Firestore
    // const unsub = onSnapshot(doc(db, 'devices/main'), snap => {
    //   setActive(mapStatusToChapter(snap.data().status));
    // });
    // return () => unsub();

    // Recipe C — REST polling
    // const id = setInterval(async () => {
    //   const r = await fetch('/api/status').then(r => r.json());
    //   setActive(mapStatusToChapter(r.status));
    // }, 2000);
    // return () => clearInterval(id);

    // Recipe D — WebSocket
    // const ws = new WebSocket('wss://your.host/ws');
    // ws.onmessage = e => setActive(JSON.parse(e.data).chapter);
    // return () => ws.close();

    // Demo mode (default) — auto-advance every 2 s.
    const id = setInterval(() => {
      setActive(cur => (cur + 1) % chapterCount);
    }, 2000);
    return () => clearInterval(id);
  }, [setActive, chapterCount]);
}
```

Every recipe returns a cleanup function so the listener detaches on
unmount — no leaks.

---

## Tech notes

- **Performance**: the ambient backdrop is three static radial gradients
  (no `filter: blur`, no infinite keyframes). Three.js scenes throttle
  cleanly and dispose all resources on unmount.
- **No-build limitation**: in-browser Babel transformation is slow on
  cold load and shows a warning in the console. For production, you can
  precompile the JSX with esbuild or vite — every `.jsx` file is
  self-contained and assigns to `window.<ComponentName>`.
- **Mobile**: nav links collapse below 980 px. The intro auto-fits the
  viewport regardless of aspect ratio.

---

## Credits

- Phoenix GLB model — sourced for this portfolio.
- Three.js 0.160.0 via unpkg.
- React 18.3.1 + Babel 7.29.0 via unpkg.
- Fonts: Inter, Space Grotesk, Instrument Serif, JetBrains Mono (Google Fonts).

---

## License

See `LICENSE`.

— Osama Sunaallah
