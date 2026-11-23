/* Contact: the last screen (23.11.2026). The 3D device large in the middle, the
   phoenix flying past it once you arrive, and a small contact box below. */
function Contact(){
  return (
    <section className="finale" id="contact">
      {/* the page-wide device (DeviceTour) sits here, large; the phoenix flies past it once you arrive */}
      <div className="contact-slot" aria-hidden="true" data-state="approved" data-lcd1="APPROVED" data-lcd2="WELCOME"></div>
      <div className="finale-card">
        <h2>Every dock deserves <em>a VeriGate</em>.</h2>
        <p>Contact the owner for more details.</p>
        <a href="https://www.linkedin.com/in/osamasunaallah/" target="_blank" rel="noopener noreferrer" className="btn primary">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 18.34V9.67H5.67v8.67h2.67zM7 8.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1zm11.34 9.84v-4.74c0-2.54-1.36-3.72-3.17-3.72-1.46 0-2.11.8-2.48 1.36V9.67h-2.67c.04.75 0 8.67 0 8.67h2.67v-4.84c0-.24.02-.48.09-.66.19-.48.63-.98 1.37-.98.97 0 1.36.74 1.36 1.82v4.66h2.83z"/></svg>
          Connect on LinkedIn
        </a>
      </div>
    </section>
  );
}

window.Contact = Contact;
