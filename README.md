# VeriGate

A one-page site for **VeriGate**, an IoT receiving device: a 13.56 MHz RFID reader on an Arduino that verifies shipments at the gate. One tap, one verified shipment, one source of truth.

**Live:** https://osamasunaallah.github.io/VeriGate/

## How it's built

A static site. React 18 and Three.js load from a CDN; the page itself runs `app.js`, which is the components below compiled from JSX to plain JavaScript (Babel, `preset-react`). There's no Babel in the browser and nothing to install.

| File | What it is |
| --- | --- |
| `index.html` | Entry point: React, Three.js (importmap), `app.js`. |
| `app.js` | Built from the `.jsx` files. Don't edit by hand. |
| `*.jsx` | Sources: `PhoenixIntro`, `Nav`, `HeroPhoto` + `DeviceWithLCD` (3D device with a live LCD), `Architecture`, `Capabilities`, `Problems`, `Solution`, `Process` + `ReceivingScene` (the 3D receiving animation), `Explorer`, `Contact`, `Footer`, `App`. |
| `kit.css`, `colors_and_type.css` | Layout, shared styles and design tokens. |
| `phoenix-bird.glb`, `verigate-device.glb` | 3D models (intro bird, device). |

To change the site, edit a `.jsx` file and rebuild `app.js` with any Babel setup (`preset-react`, each file wrapped in its own function scope, same order as in `app.js`).

## Run locally

Serve the folder with any static server, e.g. `python -m http.server 5173`, and open http://localhost:5173.

— Osama Sunaallah
