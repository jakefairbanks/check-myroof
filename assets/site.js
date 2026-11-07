/* check-myroof.com — shared behavior
   Expects window.PAGE = { variants: {...}, town: 'Denver' } set by the page (build.js). */
(function () {
  const PAGE = window.PAGE || {};
  const params = new URLSearchParams(window.location.search);

  // ── UTM-aware headline variants: ?v=hail | wind | deductible | storm-just-hit | denied
  (function applyVariant() {
    const v = (params.get('v') || params.get('variant') || params.get('creative') || 'default').toLowerCase();
    const variants = PAGE.variants || {};
    const variant = variants[v] || variants.default;
    const h = document.getElementById('hero-headline');
    const s = document.getElementById('hero-sub');
    if (variant && h && variant.headline) h.innerHTML = variant.headline;
    if (variant && s && variant.sub) s.innerHTML = variant.sub;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('utm_source',   params.get('utm_source')   || params.get('source') || '');
    set('utm_campaign', params.get('utm_campaign') || '');
    set('utm_creative', params.get('utm_creative') || v);
  })();

  // ── Meta Pixel: Contact on tap-to-call
  document.querySelectorAll('[data-event="Contact"]').forEach((el) => {
    el.addEventListener('click', () => {
      if (window.fbq) fbq('track', 'Contact');
      if (window.gtag && PAGE.gtagContactLabel) gtag('event', 'conversion', { send_to: PAGE.gtagContactLabel });
    });
  });

  // ── Meta Pixel: Schedule when a Calendly booking completes
  window.addEventListener('message', (e) => {
    if (e.data && typeof e.data.event === 'string' && e.data.event === 'calendly.event_scheduled') {
      if (window.fbq) fbq('track', 'Schedule');
      if (window.gtag && PAGE.gtagScheduleLabel) gtag('event', 'conversion', { send_to: PAGE.gtagScheduleLabel });
    }
  });

  // ── Lead form → Zapier webhook (→ JobNimbus), fires Lead
  const form = document.getElementById('lead-form');
  const success = document.getElementById('form-success');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      try {
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        payload.submitted_at = new Date().toISOString();
        payload.page_url = window.location.href;
        payload.referrer = document.referrer || '';
        // form-urlencoded + no-cors = a "simple" request: no preflight, Zapier parses fields by name.
        await fetch(form.action, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(payload).toString()
        });
        form.querySelectorAll('.form-row, label, button, .form-fineprint').forEach((el) => (el.style.display = 'none'));
        success.classList.add('show');
        if (window.fbq) fbq('track', 'Lead');
        if (window.gtag && PAGE.gtagLeadLabel) gtag('event', 'conversion', { send_to: PAGE.gtagLeadLabel });
      } catch (err) {
        btn.textContent = original;
        btn.disabled = false;
        alert('Sorry — something went wrong. Please call us directly at (720) 316-5455.');
      }
    });
  }

  // ── Hero video: tap to restart with sound (Vimeo player.js). Button always mirrors the player's real mute state.
  const soundBtn = document.getElementById('video-sound');
  const vimeoEl = document.getElementById('hero-vimeo');
  if (soundBtn && vimeoEl) {
    let player = null;
    const lbl = soundBtn.querySelector('.lbl');
    const render = (muted) => { soundBtn.setAttribute('aria-pressed', String(!muted)); lbl.textContent = muted ? 'Play with sound' : 'Mute'; };
    const getPlayer = () => {
      if (!player && window.Vimeo) {
        player = new Vimeo.Player(vimeoEl);
        player.on('volumechange', (d) => render(d.volume === 0)); // also catches Vimeo's own Unmute badge
        player.getMuted().then(render).catch(() => {});
      }
      return player;
    };
    window.addEventListener('load', getPlayer);
    soundBtn.addEventListener('click', async () => {
      const p = getPlayer(); if (!p) return;
      let muted = true;
      try { muted = await p.getMuted(); } catch (e) {}
      if (muted) {
        // Unmute first, synchronously inside the tap, so the browser credits the user gesture.
        p.setMuted(false).catch(() => {});
        p.setVolume(1).catch(() => {});
        p.setCurrentTime(0).catch(() => {});
        p.play().catch(() => {});
        if (window.fbq) fbq('trackCustom', 'VideoSoundOn');
      } else {
        p.setMuted(true).catch(() => {});
      }
      setTimeout(() => p.getMuted().then(render).catch(() => {}), 400);
    });
  }

  // ── Scroll reveal (progressive enhancement)
  document.documentElement.classList.add('js-enabled');
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
    setTimeout(() => reveals.forEach((el) => el.classList.add('in')), 2500);
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  // ── Pause review wall when offscreen (saves battery on mobile)
  const wall = document.querySelector('.reviews-wall');
  if (wall && 'IntersectionObserver' in window) {
    const tracks = wall.querySelectorAll('.wall-track');
    new IntersectionObserver((entries) => {
      entries.forEach((en) => tracks.forEach((t) => (t.style.animationPlayState = en.isIntersecting ? 'running' : 'paused')));
    }, { threshold: 0.05 }).observe(wall);
  }
})();
