/* DeviceWithLCD.jsx: the LCD painter shared by the page-wide device (DeviceTour)
   and the process animation. (The old hero-only 3D component was replaced by
   DeviceTour on 23.11.2026.) */

/* drawLCD — pixel-perfect 2D rendering of the LCD interface.
   Reads chapter data and time, paints to the offscreen canvas that
   becomes the CanvasTexture on the LCD_Screen_Plane mesh. */
function drawLCD(ctx, canvas, chap, time){
  const w = canvas.width, h = canvas.height;
  const isApproved = chap && chap.state === 'approved';
  const isWarn = chap && chap.state === 'warn';

  // ---- background gradient (blue idle / green approved) ----
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 50, w * 0.5, h * 0.35, w * 0.7);
  if (isWarn) {
    bg.addColorStop(0.00, '#D8463B');
    bg.addColorStop(0.30, '#B0302A');
    bg.addColorStop(0.65, '#7E1D1B');
    bg.addColorStop(1.00, '#561312');
  } else if (isApproved) {
    bg.addColorStop(0.00, '#2DD279');
    bg.addColorStop(0.30, '#1aa05a');
    bg.addColorStop(0.65, '#0d6e3a');
    bg.addColorStop(1.00, '#094a27');
  } else {
    bg.addColorStop(0.00, '#2A52BE');
    bg.addColorStop(0.30, '#1f3f9e');
    bg.addColorStop(0.65, '#142a72');
    bg.addColorStop(1.00, '#0c1e5a');
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // ---- dot-matrix pixel grid (subtle) ----
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 1);
  for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 1, h);

  // ---- top highlight (mimics glass top reflection) ----
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.40);
  top.addColorStop(0, 'rgba(255,255,255,0.14)');
  top.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.40);

  // ---- text lines ----
  const line1 = (chap && chap.lcdLine1) || 'VERIGATE';
  const line2 = (chap && chap.lcdLine2) || 'READY · SCAN';
  const cursorOn = Math.floor(time / 500) % 2 === 0;
  const cursor = cursorOn ? '_' : ' ';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Line 1 — main heading
  ctx.font = '700 90px "IBM Plex Mono", "Menlo", "Consolas", monospace';
  ctx.shadowColor = isWarn ? 'rgba(255,190,180,0.9)' : isApproved ? 'rgba(170,255,200,0.9)' : 'rgba(170,210,255,0.9)';
  ctx.shadowBlur = 26;
  ctx.fillStyle = isWarn ? '#FFECE8' : isApproved ? '#E8FFEF' : '#E0EBFF';
  ctx.fillText(line1 + cursor, w / 2, h * 0.36);

  // Line 2 — sub heading
  ctx.font = '600 56px "IBM Plex Mono", "Menlo", "Consolas", monospace';
  ctx.shadowBlur = 18;
  ctx.fillStyle = isWarn ? '#FFC9C0' : isApproved ? '#C8F5DA' : '#B5CDFF';
  ctx.fillText(line2, w / 2, h * 0.74);

  // ---- animated scan beam ----
  const period = 2800;
  const beamH = 70;
  const beamY = ((time % period) / period) * (h + beamH) - beamH;
  ctx.shadowBlur = 0;
  const beam = ctx.createLinearGradient(0, beamY, 0, beamY + beamH);
  beam.addColorStop(0, 'rgba(255,255,255,0)');
  beam.addColorStop(0.5, isApproved ? 'rgba(180,255,200,0.28)' : 'rgba(180,210,255,0.28)');
  beam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, beamY, w, beamH);

  // ---- subtle inner vignette to give depth ----
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.30, w * 0.5, h * 0.5, w * 0.55);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

window.drawLCD = drawLCD;   // the process animation paints its LCD with this too
