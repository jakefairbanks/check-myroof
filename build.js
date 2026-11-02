#!/usr/bin/env node
/**
 * check-myroof.com — static page generator
 *
 *   node build.js            → writes index.html, inspection.html and one page per town
 *
 * Everything shared (layout, sections, copy defaults) lives here and in assets/.
 * Per-page differences live in PAGES below. To add a town: add one entry, run the build, commit.
 * No dependencies — plain Node.
 */
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Global config
// ─────────────────────────────────────────────────────────────────────────────
const SITE = {
  phoneDisplay: '(720) 316-5455',
  phoneHref: 'tel:+17203165455',
  brand: 'Ideal Roof & Exterior Pros',
  metaPixelId: '548401943404976',
  // Google Ads tag. Leave null to omit the tag entirely (the old pages shipped a GOOGLE_TAG_ID
  // placeholder that loaded a broken script). Set e.g. 'AW-1234567890' to enable.
  gtagId: null,
  gtagLeadLabel: null,      // e.g. 'AW-1234567890/AbCdEfGh' — fired on form submit
  gtagScheduleLabel: null,  // fired on Calendly booking
  gtagContactLabel: null,   // fired on tap-to-call
  calendlyUrl: 'https://calendly.com/idealsalesteam/roof-property-inspection-hail-wind-insurance?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=ca9937',
  webhookUrl: 'https://hooks.zapier.com/hooks/catch/11818737/4briloh/',
  vimeoSrc: 'https://player.vimeo.com/video/1197583544?autoplay=1&loop=1&muted=1&autopause=0&app_id=58479',
  googleMaps: 'https://www.google.com/maps?cid=1632221881571773114',
  reviewScore: '5.0',
  reviewCount: '188',
  yearsInBusiness: '7+',
  projects: '750+',
  ocPlatinumLogo: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/6966c90d-cf61-4f78-84ff-a6263afd5912/PPC_0c100m81y4k_withPanther+copy.png?content-type=image%2Fpng',
};

const TEAM = [
  { name: 'Christina Fairbanks', role: 'Office Manager',      img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/d14fd211-98fa-4b3e-87cc-908f151b284a/DSC08839.jpg?content-type=image%2Fjpeg' },
  { name: 'Terrance Bunch',      role: 'Project Consultant',  img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/82e5811c-4e31-4c48-8b2d-385a9c0ef007/DSC09053.jpg?content-type=image%2Fjpeg' },
  { name: 'Jake Fairbanks',      role: 'Owner',               img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/6c117aa7-82e8-4a57-a44a-380570c2f9f2/DSC09038.jpg?content-type=image%2Fjpeg' },
  { name: 'Aaron Caldwell',      role: 'On-Site Supervisor',  img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/97eff6b6-62e3-4a01-a779-ba9e3657698f/DSC09064.jpg?content-type=image%2Fjpeg' },
];

// Real Google reviews (carried over from the previous build)
const REVIEWS = [
  ['Matt Forbes', 'Another company said our roof needed replacing. The insurance disagreed, so Jake came to reassess — turned out it had damage but not worth replacing. He made minor repairs for free. All I wanted was honesty. You should call him first too.'],
  ['Cao House', 'Full tear-off with Owens Corning Storm shingles. As a Platinum Preferred Contractor they brought that quality to every step, and coordinated directly with our insurance adjuster, which simplified the claims process. A year out it’s held up through storms and high winds with no issues.'],
  ['Mike Maguire', 'Ideal did a great job with our hail claim. Everything was explained — from the insurance details to the schedule to the work. I’ll use them again if another hail storm hits.'],
  ['Brenda Neil', 'Jake came recommended by neighbors who had their roofs done after the July 4th storm. He helped us through the insurance and the HOA. The roof was finished in a day and looks great. Easy process!'],
  ['Jake Conger', 'Seamless experience. They handled everything with the insurance company and the whole process was easy. Roof looks great and it went as smoothly as possible.'],
  ['Doug Barnes', 'Jake took the time to explain the entire insurance process and kept me informed as the work progressed. Would definitely recommend and use again.'],
  ['Brandon Ridder', 'Sasa communicated and set expectations the whole way through. He dealt with my insurance company efficiently and got us exactly what we needed. Thank you Sasa and Ideal!'],
  ['Barbara Butler', 'Ideal replaced my hail-damaged roof and gutters and installed new skylights. Crews were skilled and efficient, work was completed on time. Jake, Tyler, and Chris went above and beyond to make sure I was pleased.'],
  ['Derek Gulley', 'They walked me through the entire process, constantly checking in. Not one single issue — from inspection to insurance claims assistance to the actual repairs. Great company and people.'],
  ['Doc Dawg', 'Replaced our roof and other repairs caused by hail. Great company — honest and reliable. Will definitely use again and refer to family and friends.'],
  ['Alexa Parnell', 'We hired Jake and his team for a full roof replacement after last year’s hail storm. Couldn’t be more pleased with the results and the service. If another devastating storm hits, we’d use Ideal again in a heartbeat.'],
  ['Nicolette Castillo', 'Friendly, great communication, flexible with my schedule, and they finished ahead of schedule. They did a great job working with my insurance company to make sure everything that needed to be done was covered.'],
  ['Matthew McLaughlin', 'Excellent customer service through our roofing, gutter, and siding storm repair. Their expertise, insights, and follow-up were all top notch. Jake, Alex, and Tyler were great.'],
  ['B Jax', 'We had a great experience with everyone at Ideal. They were so helpful navigating the process and working with our insurance. Great communication and overall very smooth.'],
  ['Laura Zerbe', 'Kris and his team replaced our roof after a destructive spring hail storm. They did a great job, were efficient, and communication was easy.'],
];

// ─────────────────────────────────────────────────────────────────────────────
// Pages
// ─────────────────────────────────────────────────────────────────────────────
const townPage = (town, slug) => ({
  file: `${slug}.html`,
  town,
  title: `${town} CO Hail & Storm Damage Roof Repair — Free Inspection | ${SITE.brand}`,
  description: `Hail or wind damage in ${town}, CO? Free roof inspection. We handle your insurance claim end-to-end — you pay only your deductible. Free Class 4 shingle + Platinum warranty upgrades. Owens Corning Platinum Preferred.`,
  eyebrow: `Hail &amp; wind damage in ${town}, CO`,
  headline: `Hail Hit ${town}? <span class="accent">We Handle the Insurance Claim.</span>`,
  sub: `Serving ${town}, CO. Free roof inspection — if there’s hail or wind damage, we document it, meet your adjuster on-site, and handle the claim end-to-end. <strong>You pay only your deductible</strong> — and get a better roof than the one you lost.`,
  leadType: `Storm / Hail Damage — ${town} CO`,
  sourceDetail: `ads-${slug}-hail-lp`,
  whyTitle: `Storm chasers leave ${town}. We don’t.`,
  logoLinksToReviews: true,
});

const PAGES = [
  {
    file: 'index.html',
    town: 'Denver',
    title: `Denver Hail & Storm Damage Roof Repair — Free Inspection | ${SITE.brand}`,
    description: 'Hail or wind damage in Denver? Free roof inspection. We handle your insurance claim end-to-end — you pay only your deductible. Free Class 4 shingle + Platinum warranty upgrades. Owens Corning Platinum Preferred. Book online.',
    eyebrow: 'Denver hail &amp; wind damage specialists',
    headline: 'Storm Damaged Your Roof? <span class="accent">We Handle the Insurance Claim.</span>',
    sub: 'Free roof inspection. If there’s hail or wind damage, we document it, meet your adjuster on-site, and handle the claim end-to-end. <strong>You pay only your deductible</strong> — and get a better roof than the one you lost.',
    leadType: 'Storm / Hail Damage',
    sourceDetail: 'meta-ads-storm-insurance-lp',
    whyTitle: 'Storm chasers leave town. We don’t.',
  },
  {
    file: 'inspection.html',
    town: 'Denver',
    title: `Free Denver Roof Inspection — Check for Hidden Hail Damage | ${SITE.brand}`,
    description: 'Not sure if the storm damaged your roof? Free, no-pressure Denver roof inspection with photo documentation. Owens Corning Platinum Preferred. Book online in 60 seconds.',
    eyebrow: 'Free Denver roof inspections',
    headline: 'Not Sure if the Storm <span class="accent">Damaged Your Roof?</span> Find Out Free.',
    sub: 'Hail and wind damage is almost impossible to see from the ground. We’ll climb up, inspect every shingle, and give you an <strong>honest answer</strong> — no cost, no pressure, no obligation.',
    leadType: 'Free Roof Inspection',
    sourceDetail: 'meta-ads-roof-inspection-lp',
    whyTitle: 'An honest inspection, from a crew that’s staying.',
    offersIntro: 'If your roof does need replacing, every Ideal insurance roof includes two upgrades most contractors charge thousands for.',
    variantsOff: true,
  },
  townPage('Berthoud', 'berthoud'),
  townPage('Fort Morgan', 'fortmorgan'),
  townPage('Sterling', 'sterling'),
  townPage('Wiggins', 'wiggins'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Headline variants (?v=…) — town-aware
// ─────────────────────────────────────────────────────────────────────────────
function variantsFor(page) {
  const t = page.town;
  const local = t === 'Denver' ? 'Denver' : t;
  return {
    default: { headline: page.headline, sub: page.sub },
    hail: {
      headline: `Hail Hit ${local}. <span class="accent">Did It Total Your Roof?</span>`,
      sub: `Hail damage is hard to see from the ground — but your insurer will pay to replace a damaged roof. Free inspection, full claim handling, you pay only your deductible.`,
    },
    wind: {
      headline: `Missing Shingles After the Wind? <span class="accent">Insurance May Cover a New Roof.</span>`,
      sub: `Wind damage qualifies for a claim just like hail. We inspect free, document everything, and handle the paperwork with your adjuster.`,
    },
    deductible: {
      headline: `A Class 4 Roof for <span class="accent">Just Your Deductible.</span>`,
      sub: `If the storm damaged your roof, insurance covers the replacement. You cover the deductible — we handle the entire claim and upgrade you to impact-rated shingles free.`,
    },
    'storm-just-hit': {
      headline: `Storm Just Hit ${local}? <span class="accent">Get Inspected First.</span>`,
      sub: `Don’t wait for a leak. We’ll inspect your roof free, document any hail or wind damage, and tell you straight whether it’s worth filing a claim.`,
    },
    denied: {
      headline: `Claim Denied or Underpaid? <span class="accent">Let’s Take a Second Look.</span>`,
      sub: `Insurers miss legitimate damage all the time. We re-inspect free, document what was missed, and work the claim with your adjuster. You pay only your deductible.`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const I = {
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>`,
  house: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
  family: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  person: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  hail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 17a4.5 4.5 0 1 0-1-8.9A6 6 0 0 0 5 9.5a3.5 3.5 0 0 0 .5 7"/><circle cx="8" cy="20" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="16" cy="20" r="1"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`,
  google: `<svg class="rv-g" viewBox="0 0 24 24" aria-label="Google"><path d="M12 11v2.8h4a3.9 3.9 0 0 1-1.7 2.5l2.7 2.1c1.6-1.5 2.5-3.6 2.5-6.2 0-.6-.05-1.2-.15-1.7H12z" fill="#4285F4"/><path d="M6.5 14.3l-.6.5-2.1 1.6A8 8 0 0 0 12 20c2.2 0 4-.7 5.3-2l-2.7-2.1c-.7.5-1.7.8-2.6.8-2 0-3.7-1.4-4.3-3.2z" fill="#34A853"/><path d="M3.8 8a8 8 0 0 0 0 7.2l2.7-2.1A4.8 4.8 0 0 1 6.2 12c0-.5.1-1 .3-1.5z" fill="#FBBC05"/><path d="M12 7.2c1.1 0 2.1.4 2.9 1.1l2.2-2.2A8 8 0 0 0 3.8 8l2.7 2.1C7.1 8.4 8.8 7.2 12 7.2z" fill="#EA4335"/></svg>`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Partials
// ─────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;');

function head(page) {
  const gtag = SITE.gtagId ? `
<!-- Google Ads tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${SITE.gtagId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${SITE.gtagId}');</script>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="theme-color" content="#111111">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23111'/%3E%3Cpath d='M14 36 32 20l18 16' fill='none' stroke='%23CA9937' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<!--
  Generated by build.js — edit build.js / assets/*, then run:  node build.js
  Pass ?v=hail | wind | deductible | storm-just-hit | denied to swap the hero copy.
  Conversion events: Lead (form), Schedule (Calendly), Contact (tap-to-call).
-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Golos+Text:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="/assets/hero.webp" type="image/webp">
<link rel="stylesheet" href="/assets/site.css">
<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
${gtag}
<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${SITE.metaPixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${SITE.metaPixelId}&ev=PageView&noscript=1" alt=""></noscript>
</head>
<body>
`;
}

function urgency(page) {
  return `
<div class="urgency-band">
  <span class="long"><strong>Storm just hit?</strong> In Colorado you generally have <strong>one year from the storm date</strong> to file a claim — and right now every insurance roof includes <strong>free Class&nbsp;4 shingle + Platinum warranty upgrades</strong>.</span>
  <span class="short"><strong>Limited time:</strong> free Class&nbsp;4 shingle + Platinum warranty upgrades on every insurance roof.</span>
</div>`;
}

function header(page) {
  const logoHref = page.logoLinksToReviews ? SITE.googleMaps : '#';
  const logoAttrs = page.logoLinksToReviews ? ` target="_blank" rel="noopener noreferrer"` : '';
  return `
<header class="topbar">
  <div class="container topbar-inner">
    <a href="${logoHref}"${logoAttrs} class="logo" aria-label="${SITE.brand}">
      <img src="/assets/logo-light.svg" alt="${SITE.brand}" width="190" height="92">
    </a>
    <div class="topbar-right">
      <a class="topbar-rating" href="${SITE.googleMaps}" target="_blank" rel="noopener noreferrer">
        <span class="stars" aria-hidden="true">★★★★★</span>
        <span><strong>${SITE.reviewScore}</strong> · ${SITE.reviewCount} Google reviews</span>
      </a>
      <a href="${SITE.phoneHref}" class="header-call" data-event="Contact">
        ${I.phone}
        <span class="label-short">Call</span>
        <span class="label-long">${SITE.phoneDisplay}</span>
      </a>
    </div>
  </div>
</header>`;
}

function hero(page) {
  return `
<section class="hero">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="hero-grain" aria-hidden="true"></div>
  <div class="container">
    <div class="hero-grid">
      <div class="hero-copy">
        <div class="eyebrow">${page.eyebrow}</div>
        <h1 class="hero-headline silver-text" id="hero-headline">${page.headline}</h1>
        <p class="hero-sub" id="hero-sub">${page.sub}</p>

        <div class="offer-stack" aria-label="Included free with every insurance roof replacement">
          <a href="#offers" class="offer-pill">
            <span class="tag">FREE<small>UPGRADE</small></span>
            <span>
              <span class="t">Class 4 Impact-Rated Shingles</span>
              <span class="d">Owens Corning® Duration FLEX® — <em>the top hail rating a shingle can earn</em>, installed at no extra cost.</span>
            </span>
          </a>
          <a href="#offers" class="offer-pill">
            <span class="tag">FREE<small>UPGRADE</small></span>
            <span>
              <span class="t">Platinum Protection Warranty</span>
              <span class="d">25 years of workmanship coverage, <em>backed by Owens Corning — not just us.</em></span>
            </span>
          </a>
        </div>

        <div class="hero-actions">
          <div class="cta-row">
            <a href="#book" class="btn btn-primary btn-lg">${I.calendar} Book My Free Inspection</a>
            <a href="${SITE.phoneHref}" class="btn btn-ghost btn-lg" data-event="Contact">${I.phone} Call ${SITE.phoneDisplay}</a>
          </div>
          <div class="trust-strip">
            <span class="trust-item">${I.shield}<strong>Owens Corning</strong>&nbsp;Platinum Preferred</span>
            <span class="trust-item">${I.checkCircle}<strong>Licensed</strong>&nbsp;&amp; Insured</span>
            <span class="trust-item">${I.house}<strong>On-Site</strong>&nbsp;Supervisors</span>
          </div>
        </div>
      </div>

      <div class="hero-video">
        <span class="hero-corner tl" aria-hidden="true"></span>
        <div class="video-frame">
          <iframe src="${SITE.vimeoSrc}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" title="Storm damage experts — ${SITE.brand}"></iframe>
          <div class="video-caption"><span class="dot"></span><span><strong>Jake Fairbanks</strong>, Owner · tap to unmute</span></div>
        </div>
        <span class="hero-corner br" aria-hidden="true"></span>
      </div>
    </div>

    <div class="stats-ribbon" aria-label="By the numbers">
      <div class="stat"><div class="n">${SITE.yearsInBusiness}</div><div class="l">Years serving the Front Range</div></div>
      <div class="stat"><div class="n">${SITE.projects}</div><div class="l">Roofs &amp; exteriors completed</div></div>
      <div class="stat"><div class="n">${SITE.reviewScore}<span class="u">★</span></div><div class="l">${SITE.reviewCount} verified Google reviews</div></div>
      <div class="stat"><div class="n">Top <span class="u">1%</span></div><div class="l">Owens Corning Platinum Preferred</div></div>
    </div>
  </div>
</section>
<div class="hairline" aria-hidden="true"></div>`;
}

function offers(page) {
  const intro = page.offersIntro || 'Most storm-chaser roofs are the cheapest shingle the insurance scope allows, with a workmanship warranty that leaves town when they do. Every Ideal insurance roof includes two upgrades most contractors charge thousands for — at no cost to you.';
  return `
<section class="section offers" id="offers">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">Included free · limited time</div>
      <h2 class="section-title reveal">Same deductible. <span class="gold-text-dark">A much better roof.</span></h2>
      <p class="section-sub reveal">${intro}</p>
    </div>

    <div class="offers-grid">
      <article class="offer-card reveal">
        <div class="offer-top">
          <span class="offer-badge">Free upgrade #1</span>
          <div class="offer-value"><span class="was">Your cost</span><span class="now">$0</span></div>
        </div>
        <h3>Class 4 Impact-Rated Shingles</h3>
        <div class="brand-line">Owens Corning® TruDefinition® Duration FLEX®</div>
        <p class="lede">The highest impact rating a shingle can earn. Duration FLEX® is made with SBS rubberized asphalt, so it flexes and absorbs the next hailstorm instead of cracking — which is exactly what totaled the roof you have now.</p>
        <ul class="spec-list">
          <li>${I.checkCircle}<div><strong>UL 2218 &amp; FM 4473 Class 4</strong> <span>— tested with a 2-inch steel ball, twice in the same spot</span></div></li>
          <li>${I.checkCircle}<div><strong>SBS polymer-modified asphalt</strong> <span>— rubberized, flexible, built for Colorado freeze-thaw</span></div></li>
          <li>${I.checkCircle}<div><strong>130 MPH wind resistance</strong> <span>limited warranty with patented SureNail® technology</span></div></li>
          <li>${I.checkCircle}<div><strong>May qualify for a homeowner insurance discount</strong> <span>— many Colorado carriers reward Class 4 roofs; we’ll give you the paperwork to ask</span></div></li>
        </ul>
        <div class="offer-foot">Standard insurance scopes typically only pay for a basic architectural shingle. We install Duration FLEX® on every insurance replacement — the difference is on us.</div>
      </article>

      <article class="offer-card reveal">
        <div class="offer-top">
          <span class="offer-badge">Free upgrade #2</span>
          <div class="offer-value"><span class="was">Your cost</span><span class="now">$0</span></div>
        </div>
        <h3>Platinum Protection Warranty</h3>
        <div class="brand-line">Owens Corning® Platinum Protection Limited Warranty</div>
        <p class="lede">Owens Corning’s strongest coverage, and only Platinum Preferred Contractors — the top 1% nationwide — can offer it. If anything about the installation ever fails, Owens Corning stands behind it, not just our handshake.</p>
        <ul class="spec-list">
          <li>${I.checkCircle}<div><strong>25 years of full workmanship coverage</strong> <span>— labor, materials, tear-off and disposal if a repair is ever needed</span></div></li>
          <li>${I.checkCircle}<div><strong>50-year non-prorated material coverage</strong> <span>on the shingles and every Owens Corning® component in the system</span></div></li>
          <li>${I.checkCircle}<div><strong>Backed by the manufacturer</strong> <span>— coverage that stays even if a contractor doesn’t</span></div></li>
          <li>${I.checkCircle}<div><strong>Transferable to the next owner</strong> <span>— a real selling point when you list the house</span></div></li>
        </ul>
        <div class="offer-foot">Most roofers’ workmanship warranties are 1–5 years and only as good as the company still existing. Full workmanship coverage runs the first 25 years and continues, reduced, for the life of the roof. See the warranty for details.</div>
      </article>
    </div>

    <div class="compare reveal" aria-label="How an Ideal roof compares">
      <div class="compare-head"><span></span><span>Typical storm-chaser roof</span><span class="us">Your Ideal roof</span></div>
      <div class="compare-row"><span class="k">Shingle</span><span class="them">Basic architectural (Class 3 or lower)</span><span class="us">${I.check}Class 4 Duration FLEX®, free</span></div>
      <div class="compare-row"><span class="k">Workmanship warranty</span><span class="them">1–5 yrs, contractor’s promise</span><span class="us">${I.check}25 yrs, backed by Owens Corning</span></div>
      <div class="compare-row"><span class="k">Who’s on your roof</span><span class="them">A sub crew, salesman gone</span><span class="us">${I.check}Dedicated on-site supervisor</span></div>
      <div class="compare-row"><span class="k">Your yard &amp; property</span><span class="them">Tarps, maybe</span><span class="us">${I.check}Full catch-all protection system</span></div>
      <div class="compare-row"><span class="k">After the storm season</span><span class="them">Gone</span><span class="us">${I.check}Still here — ${SITE.yearsInBusiness} years and counting</span></div>
    </div>
  </div>
</section>`;
}

function steps() {
  return `
<section class="section on-paper-2">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow reveal">How it works</div>
      <h2 class="section-title reveal">From storm to new roof — without the headache.</h2>
      <p class="section-sub reveal">Most homeowners don’t realize hail damage is there until it leaks. We make the whole process simple, and we’re on your side the entire way.</p>
    </div>
    <div class="steps-grid">
      <div class="step-card reveal">
        <div class="step-num"><span class="big">01</span> Inspect</div>
        <h3>Free roof inspection</h3>
        <p>We climb up and document every dent, bruise, and granule loss with photos — the evidence your insurer needs. No cost, no obligation, and an honest answer if there’s nothing worth filing.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num"><span class="big">02</span> Claim</div>
        <h3>We meet your adjuster</h3>
        <p>We help you file the claim and stand on the roof with your insurance adjuster, so nothing legitimate gets missed, underpaid, or denied.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num"><span class="big">03</span> Replace</div>
        <h3>You pay your deductible</h3>
        <p>Once approved, insurance covers the replacement. You pay only your deductible — and get a Class 4 Owens Corning roof with Platinum warranty coverage, usually installed in a day.</p>
      </div>
    </div>
  </div>
</section>`;
}

function why(page) {
  return `
<section class="section on-dark why">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow reveal">Why homeowners choose us</div>
      <h2 class="section-title reveal silver-text">${page.whyTitle}</h2>
      <p class="section-sub reveal">After a hailstorm, your doorbell gets hit as hard as your roof. Here’s what separates us from the trucks that showed up from out of state.</p>
    </div>

    <div class="why-grid">
      <figure class="why-photo reveal">
        <picture>
          <source srcset="/assets/catchall.webp" type="image/webp">
          <img src="/assets/catchall.jpg" alt="Ideal crew mid tear-off with the catch-all property protection system wrapped around the home" width="900" height="1135" loading="lazy">
        </picture>
        <div class="why-callout" aria-hidden="true">
          <svg class="why-arrow" viewBox="0 0 140 110" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M132 8 C 120 50, 90 80, 22 96" stroke-dasharray="5 6"/>
            <path d="M34 86 L 20 97 L 36 102"/>
          </svg>
          <span class="why-pin"></span>
        </div>
        <figcaption class="why-caption">
          <span class="why-caption-tag">Catch-all system in use</span>
          <strong>Every tear-off, wrapped.</strong> Debris and nails land in the net — not your landscaping, siding, windows or AC unit.
        </figcaption>
        <span class="why-photo-badge">Real Ideal job site · Denver, CO</span>
      </figure>

      <ul class="why-list">
        <li class="why-item reveal">
          <div class="why-icon">${I.shield}</div>
          <div class="why-body">
            <h3>Owens Corning Platinum Preferred</h3>
            <p>Top 1% of roofers nationwide. That tier is what unlocks the Platinum warranty, and it means your roof is installed to exact spec by a vetted company — not a crew passing through after the storm.</p>
            <img class="why-oc" loading="lazy" alt="Owens Corning Platinum Preferred Contractor" src="${SITE.ocPlatinumLogo}">
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.person}</div>
          <div class="why-body">
            <h3>An on-site supervisor, every job</h3>
            <p>A member of our team is on your property for the entire install — not a salesman who disappears after the contract is signed. Questions get answered on the spot, and the crew is held to our standard, not theirs.</p>
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.family}</div>
          <div class="why-body">
            <h3>Family-run, Denver-based</h3>
            <p>Ideal is owned and run by the Fairbanks family. The name on the truck is the name that answers the phone — and the name that’s still here next storm season, ${SITE.yearsInBusiness} years in.</p>
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.house}</div>
          <div class="why-body">
            <h3>Catch-all property protection</h3>
            <p>Before the first shingle comes off, we wrap your home in a catch-all system so landscaping, AC units, windows and siding never see a nail. That’s it in the photo.</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</section>
<div class="hairline" aria-hidden="true"></div>`;
}

function booking() {
  return `
<section class="section on-paper" id="book">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">Schedule your free inspection</div>
      <h2 class="section-title reveal">Pick a time. We’ll check your roof.</h2>
      <p class="section-sub reveal">Usually 30–45 minutes on-site. We’ll tell you straight whether you have a claim worth filing — and if you don’t, we’ll say so.</p>
    </div>
    <div class="booking-card reveal">
      <div class="calendly-inline-widget" data-url="${SITE.calendlyUrl}" style="min-width:320px;height:700px;"></div>
      <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
    </div>
    <div class="book-note">
      <span>${I.clock}Takes 60 seconds to book</span>
      <span>${I.checkCircle}No obligation, no pressure</span>
      <span>${I.shield}Photo report included</span>
    </div>
  </div>
</section>`;
}

function leadForm(page) {
  return `
<section class="section on-paper-2">
  <div class="container">
    <div class="form-card reveal">
      <div class="form-copy">
        <div class="eyebrow">Prefer a call?</div>
        <h2>Rather have us call you?</h2>
        <p>Drop your info and we’ll call within one business hour to schedule your free inspection — no obligation, no high-pressure sales pitch.</p>
        <ul>
          <li>${I.check}Free, no-obligation inspection</li>
          <li>${I.check}We handle the insurance paperwork</li>
          <li>${I.check}Free Class 4 + Platinum warranty upgrades</li>
          <li>${I.check}Local crew — not storm chasers</li>
        </ul>
      </div>
      <form class="lead-form" id="lead-form" action="${SITE.webhookUrl}" method="POST">
        <div class="form-row">
          <label><span class="label-text">First name</span><input name="first_name" type="text" autocomplete="given-name" placeholder="Jane" required></label>
          <label><span class="label-text">Last name</span><input name="last_name" type="text" autocomplete="family-name" placeholder="Smith" required></label>
        </div>
        <label><span class="label-text">Phone number</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(303) 555-0123" required></label>
        <input type="hidden" name="lead_source" value="Meta Ads">
        <input type="hidden" name="lead_type" value="${esc(page.leadType)}">
        <input type="hidden" name="source_detail" value="${page.sourceDetail}">
        <input type="hidden" name="offer" value="Free Class 4 Duration FLEX + Platinum Warranty">
        <input type="hidden" name="utm_source" id="utm_source" value="">
        <input type="hidden" name="utm_campaign" id="utm_campaign" value="">
        <input type="hidden" name="utm_creative" id="utm_creative" value="">
        <button type="submit">Get My Free Inspection →</button>
        <div class="form-fineprint">By submitting, you agree we may contact you about your project. We never sell your info.</div>
        <div class="form-success" id="form-success">✓ Got it. We’ll call you within one business hour.</div>
      </form>
    </div>
  </div>
</section>`;
}

function team() {
  return `
<section class="section on-paper">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow reveal">Meet the crew</div>
      <h2 class="section-title reveal">The team behind the reputation.</h2>
      <p class="section-sub reveal">Real, local people you’ll actually work with — on your roof and in your corner with the adjuster.</p>
    </div>
    <div class="team-row reveal">
      ${TEAM.map((m) => `
      <figure class="team-member">
        <img class="team-photo" loading="lazy" alt="${m.name}" src="${m.img}">
        <figcaption><span class="team-name">${m.name}</span><span class="team-role">${m.role}</span></figcaption>
      </figure>`).join('')}
    </div>
  </div>
</section>`;
}

function reviews() {
  const card = ([name, text]) => `
        <figure class="rv-card">
          <div class="rv-top"><span class="rv-stars" aria-label="5 stars">★★★★★</span>${I.google}</div>
          <p>${text}</p>
          <figcaption><span class="rv-av" aria-hidden="true">${name[0]}</span>${name}<span class="rv-src">· Google</span></figcaption>
        </figure>`;
  const cols = [REVIEWS.slice(0, 5), REVIEWS.slice(5, 10), REVIEWS.slice(10, 15)];
  return `
<section class="section reviews">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">Real reviews from real neighbors</div>
      <h2 class="section-title reveal silver-text">Hundreds of Front Range roofs.<br><span class="gold-text">Hundreds of relieved homeowners.</span></h2>
      <div class="rv-meta reveal"><span class="rv-stars-xl" aria-hidden="true">★★★★★</span><span><strong>${SITE.reviewScore}</strong> on Google · <strong>${SITE.reviewCount}</strong> verified reviews</span></div>
    </div>
  </div>
  <div class="container">
    <div class="reviews-wall reveal" aria-label="Customer reviews">
      ${cols.map((c) => `<div class="wall-col"><div class="wall-track">${c.map(card).join('')}${c.map(card).join('')}</div></div>`).join('')}
    </div>
  </div>
</section>
<div class="hairline" aria-hidden="true"></div>`;
}

function faq() {
  const items = [
    ['Is the inspection really free — what’s the catch?', 'It’s free, and there’s no obligation. We inspect, photograph, and tell you honestly whether you have damage worth a claim. If you don’t, we’ll say so and leave you with the photos. We only earn anything if you choose us to do the work.'],
    ['Will filing a claim raise my insurance rates?', 'In Colorado, hail and wind are “acts of God,” and insurers generally can’t surcharge you individually for a single weather claim the way they would for an at-fault car accident. Rates in hail-prone areas do rise over time for everyone, claim or not. Installing a Class 4 roof may actually earn you a discount — ask your carrier.'],
    ['What do I actually pay?', 'Your deductible — that’s it. Insurance pays the rest of the approved scope, and we include the Class 4 Duration FLEX® shingle upgrade and the Platinum Protection warranty at no additional cost. We’ll never ask you to pay for upgrades the scope didn’t cover.'],
    ['Can you “waive” or “eat” my deductible?', 'No — and anyone who offers to is breaking Colorado law (SB 38) and putting you at risk of insurance fraud. We give you something better: a legitimately upgraded roof and a warranty backed by Owens Corning, at the same deductible you’d pay anyone else.'],
    ['How long do I have to file after a storm?', 'Most Colorado policies give you one year from the date of loss, but some are shorter, and damage gets harder to prove the longer you wait. If a storm hit in the last 12 months, get inspected now.'],
    ['What if my claim was already denied or underpaid?', 'That happens more than you’d think — adjusters miss damage, especially on steep or multi-slope roofs. We’ll re-inspect free, document what was missed, and help you request a re-inspection with your carrier.'],
  ];
  return `
<section class="section on-paper">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">Straight answers</div>
      <h2 class="section-title reveal">Questions homeowners ask us after every storm.</h2>
    </div>
    <div class="faq-list reveal">
      ${items.map(([q, a]) => `
      <details class="faq-item">
        <summary>${q}<span class="plus">${I.plus}</span></summary>
        <div class="a">${a}</div>
      </details>`).join('')}
    </div>
  </div>
</section>`;
}

function finalCta(page) {
  return `
<section class="final-cta">
  <div class="container">
    <div class="inner reveal">
      <div class="eyebrow center">Free inspection · free upgrades</div>
      <h2 class="silver-text">Don’t wait for the leak.</h2>
      <p>Book your free inspection today. If there’s a claim, we handle it end-to-end and you get a Class 4 roof with 25 years of manufacturer-backed workmanship coverage — for your deductible.</p>
      <div class="cta-row">
        <a href="#book" class="btn btn-primary btn-lg">${I.calendar} Book My Free Inspection</a>
        <a href="${SITE.phoneHref}" class="btn btn-ghost btn-lg" data-event="Contact">${I.phone} Call ${SITE.phoneDisplay}</a>
      </div>
    </div>
  </div>
</section>`;
}

function footer() {
  return `
<footer>
  <div class="container foot-grid">
    <a class="foot-logo" href="https://myidealpros.com" target="_blank" rel="noopener"><img src="/assets/logo-light.svg" alt="${SITE.brand}" width="190" height="92"></a>
    <div>
      <div class="foot-main">${SITE.brand} · Denver, CO · <a href="${SITE.phoneHref}" data-event="Contact">${SITE.phoneDisplay}</a> · <a href="https://myidealpros.com" target="_blank" rel="noopener">myidealpros.com</a></div>
      <div class="foot-links">
        <a href="https://myidealpros.com/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>
        <a href="https://myidealpros.com/terms-and-conditions" target="_blank" rel="noopener">Terms &amp; Conditions</a>
      </div>
      <div class="foot-legal">Owens Corning Platinum Preferred · Licensed &amp; Insured. We are not a public adjuster or law firm; we assist with the insurance process and you are free to choose your own contractor. Free upgrade offers apply to insurance-approved full roof replacements installed by ${SITE.brand}; see the Owens Corning® Platinum Protection Limited Warranty for complete coverage terms, limitations, and transfer requirements. Class 4 insurance discounts vary by carrier and policy. Owens Corning®, Duration FLEX®, TruDefinition® and SureNail® are trademarks of Owens Corning.</div>
    </div>
  </div>
</footer>

<div class="sticky-call" role="region" aria-label="Quick actions">
  <div class="row">
    <a class="call" href="${SITE.phoneHref}" data-event="Contact">${I.phone} Call Now</a>
    <a class="book" href="#book">${I.calendar} Free Inspection</a>
  </div>
</div>
`;
}

function scripts(page) {
  const variants = page.variantsOff ? { default: { headline: page.headline, sub: page.sub } } : variantsFor(page);
  const cfg = {
    town: page.town,
    variants,
    gtagLeadLabel: SITE.gtagLeadLabel,
    gtagScheduleLabel: SITE.gtagScheduleLabel,
    gtagContactLabel: SITE.gtagContactLabel,
  };
  return `
<script>window.PAGE = ${JSON.stringify(cfg)};</script>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────────────────────
function render(page) {
  return [
    head(page), urgency(page), header(page), hero(page), offers(page), steps(), why(page),
    booking(), leadForm(page), team(), reviews(), faq(), finalCta(page), footer(), scripts(page),
  ].join('\n');
}

for (const page of PAGES) {
  const out = path.join(__dirname, page.file);
  fs.writeFileSync(out, render(page));
  console.log(`✓ ${page.file} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}
