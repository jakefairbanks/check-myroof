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
const crypto = require('crypto');
// Content hash for cache-busting: /assets/site.css?v=abc123 changes whenever the file changes.
const ver = (file) => crypto.createHash('md5').update(fs.readFileSync(path.join(__dirname, 'assets', file))).digest('hex').slice(0, 8);
const CSS_V = ver('site.css');
const JS_V = ver('site.js');

// ─────────────────────────────────────────────────────────────────────────────
// Global config
// ─────────────────────────────────────────────────────────────────────────────
const SITE = {
  phoneDisplay: '(720) 316-5455',
  phoneHref: 'tel:+17203165455',
  brand: 'Ideal Roof & Exterior Pros',
  origin: 'https://www.check-myroof.com',
  metaPixelId: '548401943404976',
  // Google Ads tag. Leave null to omit the tag entirely (the old pages shipped a GOOGLE_TAG_ID
  // placeholder that loaded a broken script). Set e.g. 'AW-1234567890' to enable.
  gtagId: null,
  gtagLeadLabel: null,      // e.g. 'AW-1234567890/AbCdEfGh' — fired on form submit
  gtagScheduleLabel: null,  // fired on Calendly booking
  gtagContactLabel: null,   // fired on tap-to-call
  calendlyUrl: 'https://calendly.com/idealsalesteam/roof-property-inspection-hail-wind-insurance?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=ca9937',
  webhookUrl: 'https://hooks.zapier.com/hooks/catch/11818737/4briloh/',
  // 1:1 square hero video. Autoplays muted + loops; the "Play with sound" button unmutes via player.js.
  vimeoSrc: 'https://player.vimeo.com/video/1244508882?badge=0&autoplay=1&loop=1&muted=1&autopause=0&playsinline=1&app_id=58479',
  googleMaps: 'https://www.google.com/maps?cid=1632221881571773114',
  reviewScore: '5.0',
  // Verified Nov 2, 2026: 5.0 average, 188 Google reviews. Shown as 180+ so it stays true as reviews come in.
  reviewCount: '180+',
  yearsInBusiness: '7+',
  projects: '750+',
  ocPlatinumLogo: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/6966c90d-cf61-4f78-84ff-a6263afd5912/PPC_0c100m81y4k_withPanther+copy.png?content-type=image%2Fpng',
};

const TEAM = [
  { name: 'Christina Fairbanks', role: 'Production & Operations',img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/d14fd211-98fa-4b3e-87cc-908f151b284a/DSC08839.jpg?content-type=image%2Fjpeg' },
  { name: 'Terrance Bunch',      role: 'Project Consultant',  img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/82e5811c-4e31-4c48-8b2d-385a9c0ef007/DSC09053.jpg?content-type=image%2Fjpeg' },
  { name: 'Jake Fairbanks',      role: 'Owner',               img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/6c117aa7-82e8-4a57-a44a-380570c2f9f2/DSC09038.jpg?content-type=image%2Fjpeg' },
  { name: 'Aaron Caldwell',      role: 'On-Site Supervisor',  img: 'https://images.squarespace-cdn.com/content/5fc52c5a1452f90b7f00ebfd/97eff6b6-62e3-4a01-a779-ba9e3657698f/DSC09064.jpg?content-type=image%2Fjpeg' },
];

// Real Google reviews — verbatim text from myidealpros.com/reviews (service labels as tagged there),
// plus Matt Forbes & Brenda Neil carried over from the previous build. Chosen for variety across
// roofing, siding, painting, gutters, honest repair calls, communication, and insurance work.
// [name, service label, review]
const REVIEWS = [
  // column 1
  ['Jody Green', 'Exterior Painting', 'Jake went above and beyond to make sure my house painting experience was positive and met my expectations. We worked through color selection and walked through all the work to be done. He went out of his way to do several walk throughs to ensure all work was top quality. The crew was thorough, diligent, and friendly.'],
  ['Katie Cochran', 'Roof Inspection', 'I had a great experience working with Jake and the team at Ideal Roofing. Their communication and thoughtfulness really stood out, and it always felt like they were looking out for my best interest instead of just making a sale. Even though I didn’t need a new roof this time, I wouldn’t hesitate to call them if I ever do.'],
  ['Cao House', 'Roof Replacement + Gutters', 'We had a full tear-off and replacement with Owens Corning TruDefinition Duration Storm shingles, along with all new roofing components. As an Owens Corning Platinum Preferred Contractor, they brought that level of quality to every step. Communication was prompt, the crew was professional, and the jobsite was left clean with a thorough nail sweep. A year out, the roof has held up through a few storms and high winds without any issues.'],
  ['Con Tsang', 'Siding Replacement', 'Very friendly, gave us a very competitive quote, and completed the job in just over one day. The owners are great, include post install inspection and minor repairs to the siding of the house at no extra charge. Highly recommended!'],
  ['Brenda Neil', 'Roof Replacement · Insurance', 'Jake came recommended by neighbors who had their roofs done after the July 4th storm. He helped us through the insurance and the HOA. The roof was finished in a day and looks great. Easy process!'],
  // column 2
  ['Matt Forbes', 'Roof Assessment', 'Another company said our roof needed replacing. The insurance disagreed, so Jake came to reassess — turned out it had damage but not worth replacing. He made minor repairs for free. All I wanted was honesty. You should call him first too.'],
  ['Genaro Laynes', 'HOA-Approved Exterior Paint', 'Jake and his team worked diligently to navigate our HOA restrictions and once approved did an amazing job painting our home. They were careful to work around our large trees and spared no efforts in completing the project to our satisfaction.'],
  ['Tadhg Ua Deaghaidh', 'Roof + Gutter Install', 'I’m very satisfied with the quality of the workmanship provided, and the professionalism exhibited by Ideal. The replacement gutters were installed quickly, and the additional gutters I requested were added seamlessly. Jake and James and the crew are really top notch. I can’t recommend them any higher.'],
  ['Paz Torres', 'Roof Replacement', 'Ideal Roofing came through when I needed them the most. The previous roof contract company had left me hanging. Since the first time that we met, they walked us through everything that was going to be done. There was no hidden fees, they were clear and explained all the charges to us. The workers were very professional and finished the work in a timely manner.'],
  ['Kathy McKenna', 'Partial Roof Replacement', 'Fantastic crew and wonderful communication! Chris and his team were able to perfectly match my existing roof shingles for a partial roof replacement. Work was completed in a timely manner and all work materials were removed promptly. Would highly recommend them!'],
  // column 3
  ['Debbie Fox', 'Roof + Exterior Paint', 'Professional, skilled, efficient, great communicators and terrific on-the-job coverage. True to their word and available to talk through all details of the process, product, service. Highly recommend for total roofing replacement and exterior house painting.'],
  ['Mark Mimovich', 'Roof Inspection & Repair', 'The service and integrity of the folks at Ideal Roofing is hard to find these days. Eric & Sasha did inspections on our roof for hail damage and a leak repair. In two occasions they could have recommended and done fixes that were not necessary but instead they were honest with their assessment.'],
  ['Matthew McLaughlin', 'Roof + Gutter + Siding', 'Ideal had excellent customer service with our roofing, gutter, and siding storm repair experience. Their expertise, insights, and follow-up was all top notch. Would highly recommend their team. Jake, Alex, and Tyler were great.'],
  ['Barbara Butler', 'Full Exterior Package', 'Ideal replaced my hail-damaged roof and gutters, installed new solar skylights, and painted my house. Their crews were skilled and efficient. Work was scheduled and completed on time. The team leaders (Jake, Tyler, and Chris) went above and beyond to make sure I was pleased with their work.'],
  ['Alexa Parnell', 'Roof Replacement + Painting', 'We engaged Jake and his team for full roof replacement and painting after last year’s hail storm. We couldn’t be more pleased with their results and stellar customer service throughout the whole process. We hope we don’t have another devastating storm, but if we do, we’d use Ideal Roofing again in a heartbeat!'],
];

// ─────────────────────────────────────────────────────────────────────────────
// Storm campaign mode
//   The page is evergreen by default. Storm messaging (storm band, storm hero copy, the current
//   insurance-roof upgrade offer) turns on for:
//     • town pages (campaign: 'storm' — built in)
//     • any page opened with ?c=storm or one of the ad variants ?v=hail|wind|deductible|storm-just-hit|denied
//   Same page, same sections — only the storm-specific pieces switch on.
// ─────────────────────────────────────────────────────────────────────────────
const STORM_VARIANTS = ['storm', 'hail', 'wind', 'deductible', 'storm-just-hit', 'denied'];

// Current insurance-roof upgrade offer. Shown ONLY in storm mode.
// ⚠ Needs Jake's sign-off on eligibility + end date before relying on it. Set enabled:false to hide everywhere.
const PROMO = {
  enabled: true,
  endsText: '',   // e.g. 'through Dec 31, 2026' — leave '' until confirmed
  hiddenValue: 'Free Class 4 Duration FLEX + Platinum Warranty',
};

// ─────────────────────────────────────────────────────────────────────────────
// Pages
// ─────────────────────────────────────────────────────────────────────────────
const GENERAL = {
  eyebrow: 'Local roofing &amp; exterior · Denver Metro &amp; Boulder',
  headline: 'Roofing &amp; Exterior Work <span class="accent">You Can Feel Good About.</span>',
  sub: 'From roof replacements and siding repairs to exterior painting, gutters, and storm restoration, our local team makes taking care of your home straightforward.',
};

const townPage = (town, slug) => ({
  file: `${slug}.html`,
  town,
  campaign: 'storm',
  title: `${town}, CO Roofing & Storm Restoration — Free Inspection | ${SITE.brand}`,
  description: `Hail or wind damage in ${town}, CO? Free roof inspection from a five-star local roofing and exterior team. We document the damage, meet your adjuster, and handle the restoration. Owens Corning Platinum Preferred.`,
  eyebrow: `Storm restoration · ${town}, CO`,
  headline: `Hail Hit ${town}? <span class="accent">We Know the Insurance Process.</span>`,
  sub: `Free roof inspection from a five-star local roofing and exterior team. If there’s hail or wind damage, we’ll document it, meet your adjuster on-site, and take care of the restoration from start to finish.`,
  leadType: `Storm / Hail Damage — ${town} CO`,
  sourceDetail: `ads-${slug}-hail-lp`,
  logoLinksToReviews: true,
});

const PAGES = [
  {
    file: 'index.html',
    town: 'Denver',
    campaign: 'general',
    title: `Roofing, Siding, Painting & Gutters in Denver & Boulder — Free Inspection | ${SITE.brand}`,
    description: 'Five-star local roofing and exterior contractor serving Denver Metro and Boulder. Roof repair and replacement, siding, exterior painting, gutters, and storm restoration. Owens Corning Platinum Preferred. Free inspections — book online.',
    ...GENERAL,
    // Lead attribution: storm-mode visits keep the original value so existing Zaps/JobNimbus mapping still match.
    leadType: 'Roof / Exterior Inspection',
    leadTypeStorm: 'Storm / Hail Damage',
    sourceDetail: 'meta-ads-storm-insurance-lp',
  },
  {
    file: 'inspection.html',
    town: 'Denver',
    campaign: 'general',
    title: `Free Roof Inspection — Denver Metro & Boulder | ${SITE.brand}`,
    description: 'Free, no-pressure roof inspection from a five-star local roofing and exterior team. Photos of what we find and a straight answer. Owens Corning Platinum Preferred. Book online.',
    eyebrow: 'Free roof inspections · Denver Metro &amp; Boulder',
    headline: 'Wondering What Shape Your Roof <span class="accent">Is Really In?</span>',
    sub: 'Whether it’s getting older, it’s been through a few storms, or something just looks off, we’ll get up there, photograph what we find, and give you a straight answer — no cost and no pressure.',
    leadType: 'Free Roof Inspection',
    leadTypeStorm: 'Free Roof Inspection',
    sourceDetail: 'meta-ads-roof-inspection-lp',
  },
  townPage('Berthoud', 'berthoud'),
  townPage('Fort Morgan', 'fortmorgan'),
  townPage('Sterling', 'sterling'),
  townPage('Wiggins', 'wiggins'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Storm hero variants (?v=… / ?c=storm). Keys match the live ad URLs — don't rename them.
// No promises about coverage, approvals, or what the homeowner will pay.
// ─────────────────────────────────────────────────────────────────────────────
function variantsFor(page) {
  const local = page.town;
  const stormDefault = page.campaign === 'storm'
    ? { eyebrow: page.eyebrow, headline: page.headline, sub: page.sub }
    : {
        eyebrow: `Storm restoration · Denver Metro &amp; Boulder`,
        headline: `Storm Damage? <span class="accent">We Know the Insurance Process.</span>`,
        sub: `Free roof inspection from a five-star local roofing and exterior team. If there’s hail or wind damage, we’ll document it, meet your adjuster on-site, and take care of the restoration from start to finish.`,
      };
  return {
    general: { eyebrow: page.eyebrow, headline: page.headline, sub: page.sub },
    storm: stormDefault,
    hail: {
      eyebrow: stormDefault.eyebrow,
      headline: `Hail Hit ${local}. <span class="accent">Is Your Roof Okay?</span>`,
      sub: `Hail damage is hard to spot from the ground. We’ll inspect for free, photograph what we find, and if there’s a claim to be made, help you through it from the first adjuster visit to the finished roof.`,
    },
    wind: {
      eyebrow: stormDefault.eyebrow,
      headline: `Missing Shingles After the Wind? <span class="accent">Let’s Take a Look.</span>`,
      sub: `Wind damage can be covered just like hail, depending on your policy. We’ll inspect for free, document what we find, and walk you through your options.`,
    },
    deductible: {
      eyebrow: stormDefault.eyebrow,
      headline: `Insurance Roof Coming Up? <span class="accent">Ask About Our Class 4 Upgrade.</span>`,
      sub: `On qualifying insurance roof replacements, we’re currently upgrading to Owens Corning Duration FLEX® Class 4 shingles at no added cost. Start with a free inspection.`,
    },
    'storm-just-hit': {
      eyebrow: stormDefault.eyebrow,
      headline: `Storm Just Hit ${local}? <span class="accent">Get It Inspected First.</span>`,
      sub: `Don’t wait for a leak. We’ll inspect your roof for free, document any hail or wind damage, and tell you straight whether it’s worth filing a claim.`,
    },
    denied: {
      eyebrow: stormDefault.eyebrow,
      headline: `Claim Denied or Underpaid? <span class="accent">Let’s Take a Second Look.</span>`,
      sub: `Adjusters sometimes miss legitimate damage. We’ll re-inspect for free, document what we find, and help you request a re-inspection with your carrier.`,
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
  const canonical = `${SITE.origin}/${page.file === 'index.html' ? '' : page.file.replace('.html', '')}`;
  return `<!DOCTYPE html>
<html lang="en" class="campaign-${page.campaign}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="theme-color" content="#111111">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE.brand}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.origin}/assets/hero.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23111'/%3E%3Cpath d='M14 36 32 20l18 16' fill='none' stroke='%23CA9937' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<!--
  Generated by build.js — edit build.js / assets/*, then run:  node build.js
  Evergreen by default. Storm mode (storm band, storm hero, upgrade offer) turns on for town pages,
  ?c=storm, or the ad variants ?v=hail | wind | deductible | storm-just-hit | denied.
  Conversion events: Lead (form), Schedule (Calendly), Contact (tap-to-call).
-->
<script>
  // Decide storm vs. general before first paint so nothing flickers.
  (function(){var q=new URLSearchParams(location.search),v=(q.get('v')||q.get('variant')||q.get('creative')||'').toLowerCase(),c=(q.get('c')||'').toLowerCase();
  if(c==='storm'||${JSON.stringify(STORM_VARIANTS)}.indexOf(v)>-1){var h=document.documentElement;h.classList.remove('campaign-general');h.classList.add('campaign-storm');}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Golos+Text:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="/assets/hero.webp" type="image/webp">
<link rel="stylesheet" href="/assets/site.css?v=${CSS_V}">
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
  const promo = PROMO.enabled
    ? ` Ask about our <strong>Class&nbsp;4 upgrade</strong> on qualifying insurance roofs${PROMO.endsText ? ` ${PROMO.endsText}` : ''}.`
    : '';
  return `
<div class="urgency-band only-general">
  <span class="long">Free roof &amp; exterior inspections across <strong>Denver Metro &amp; Boulder</strong> — roofing, siding, painting, gutters, and storm restoration.</span>
  <span class="short">Free inspections across <strong>Denver Metro &amp; Boulder</strong>.</span>
</div>
<div class="urgency-band only-storm">
  <span class="long"><strong>Storm just hit?</strong> Most policies set a deadline to file, so get inspected sooner rather than later.${promo}</span>
  <span class="short"><strong>Storm just hit?</strong> Get inspected before the filing window closes.</span>
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
        <div class="eyebrow" id="hero-eyebrow">${page.eyebrow}</div>
        <h1 class="hero-headline silver-text" id="hero-headline">${page.headline}</h1>
        <p class="hero-sub" id="hero-sub">${page.sub}</p>

        <nav class="svc-chips" aria-label="Services">
          <a href="#services">Roofing</a>
          <a href="#services">Siding</a>
          <a href="#services">Exterior painting</a>
          <a href="#services">Gutters</a>
          <a href="#insurance">Storm restoration</a>
        </nav>

        <div class="hero-actions">
          <div class="cta-row">
            <a href="#book" class="btn btn-primary btn-lg">${I.calendar} Schedule a Free Inspection</a>
            <a href="${SITE.phoneHref}" class="btn btn-ghost btn-lg" data-event="Contact">${I.phone} Call ${SITE.phoneDisplay}</a>
          </div>
          <div class="trust-strip">
            <a class="trust-item" href="${SITE.googleMaps}" target="_blank" rel="noopener noreferrer"><span class="trust-stars" aria-hidden="true">★★★★★</span><span><strong>${SITE.reviewScore}</strong> on Google · ${SITE.reviewCount} reviews</span></a>
            <span class="trust-item">${I.shield}<span><strong>Owens Corning</strong> Platinum Preferred</span></span>
            <span class="trust-item">${I.house}<span>Serving <strong>Denver Metro &amp; Boulder</strong></span></span>
          </div>
        </div>
      </div>

      <div class="hero-video">
        <span class="hero-corner tl" aria-hidden="true"></span>
        <div class="video-frame">
          <iframe id="hero-vimeo" src="${SITE.vimeoSrc}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" title="Check My Roof — ${SITE.brand}"></iframe>
        </div>
        <span class="hero-corner br" aria-hidden="true"></span>
        <div class="video-bar">
          <span class="video-who"><span class="dot"></span><span><strong>Jake Fairbanks</strong> · Owner</span></span>
          <button type="button" class="video-sound" id="video-sound" aria-pressed="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>
            <span class="lbl">Play with sound</span>
          </button>
        </div>
      </div>
    </div>

    <div class="stats-ribbon" aria-label="By the numbers">
      <div class="stat"><div class="n">2019</div><div class="l">Locally owned &amp; operated since</div></div>
      <div class="stat"><div class="n">${SITE.projects}</div><div class="l">Roofs &amp; exteriors completed</div></div>
      <div class="stat"><div class="n">${SITE.reviewScore}<span class="u">★</span></div><div class="l">Google rating · ${SITE.reviewCount} reviews</div></div>
      <div class="stat"><div class="n">Top <span class="u">1%</span></div><div class="l">Owens Corning Platinum Preferred</div></div>
    </div>
  </div>
</section>
<div class="hairline" aria-hidden="true"></div>`;
}

function services(page) {
  const svc = [
    {
      label: 'Roofing', title: 'Roof repairs &amp; replacements',
      lede: 'Whether it’s a few problem spots or a full tear-off, we’ll tell you honestly which one your roof needs — and if it still has years left, we’ll say so.',
      items: [
        ['Roof replacements', 'with Owens Corning® shingle systems'],
        ['Roof repairs', '— leaks, missing shingles, flashing and vents'],
        ['Impact-resistant shingles', '— Class 4 options built for Colorado hail'],
        ['Specialty systems', '— metal, synthetic shake and slate'],
      ],
    },
    {
      label: 'Siding &amp; exterior repairs', title: 'Siding, trim &amp; exterior repairs',
      lede: 'From a few damaged boards to a full re-side, we match what’s there or help you choose something that’ll hold up better.',
      items: [
        ['Siding replacement', '— including James Hardie® fiber cement'],
        ['Siding repairs', '— storm damage, rot, and worn sections'],
        ['Fascia, soffit &amp; trim', 'repaired or replaced'],
        ['Exterior repairs', 'that come up along the way'],
      ],
    },
    {
      label: 'Exterior painting', title: 'Exterior painting',
      lede: 'Colorado sun is hard on paint. Most of a good paint job happens before the first coat — so that’s where we spend the time.',
      items: [
        ['Complete exterior repaints', 'for stucco, wood, and fiber cement'],
        ['Surface prep', '— cleaning, scraping, caulking, and repairs'],
        ['Protective coatings', 'and finishing details'],
        ['Help with color selection', 'and HOA approvals'],
      ],
    },
    {
      label: 'Gutters', title: 'Gutters &amp; downspouts',
      lede: 'New gutters on their own, or alongside a roof so everything is installed and sealed together.',
      items: [
        ['Gutter replacement', 'and new installations'],
        ['Downspouts', 'sized and placed to move water away from the house'],
        ['Gutter protection', 'to keep leaves and debris out'],
        ['Storm-damaged gutters', 'replaced as part of a restoration'],
      ],
    },
  ];
  return `
<section class="section offers" id="services">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">What we do</div>
      <h2 class="section-title reveal">One local team for <span class="gold-text-dark">the whole exterior.</span></h2>
      <p class="section-sub reveal">Small repairs, full replacements, and everything in between. Same crew standards, same communication, whether it’s a few shingles or the whole house.</p>
    </div>

    <div class="offers-grid">
      ${svc.map((s) => `
      <article class="offer-card reveal">
        <div class="offer-top"><span class="offer-badge">${s.label}</span></div>
        <h3>${s.title}</h3>
        <p class="lede">${s.lede}</p>
        <ul class="spec-list">
          ${s.items.map(([a, b]) => `<li>${I.checkCircle}<div><strong>${a}</strong> <span>${b}</span></div></li>`).join('\n          ')}
        </ul>
      </article>`).join('')}
    </div>

    <a class="svc-storm-link reveal" href="#insurance">
      <span class="svc-storm-icon">${I.hail}</span>
      <span><strong>Storm damage &amp; insurance restoration</strong><span class="d">Hail and wind inspections, damage documentation, estimate reviews, and the full restoration. See how it works</span></span>
      <span class="svc-storm-arrow" aria-hidden="true">→</span>
    </a>

    <div class="compare reveal" aria-label="What working with Ideal looks like">
      <div class="compare-head"><span></span><span>What you might be used to</span><span class="us">Working with Ideal</span></div>
      <div class="compare-row"><span class="k">Recommendations</span><span class="them">Whatever’s the biggest job</span><span class="us">${I.check}What your home actually needs</span></div>
      <div class="compare-row"><span class="k">Who’s on site</span><span class="them">A crew you’ve never met</span><span class="us">${I.check}A project supervisor from our team</span></div>
      <div class="compare-row"><span class="k">Communication</span><span class="them">You chase them for updates</span><span class="us">${I.check}You know what’s happening and when</span></div>
      <div class="compare-row"><span class="k">Your property</span><span class="them">Tarps, maybe</span><span class="us">${I.check}Catch-all protection and a full cleanup</span></div>
      <div class="compare-row"><span class="k">After the job</span><span class="them">Hard to reach</span><span class="us">${I.check}A local office in Wheat Ridge since 2019</span></div>
    </div>
  </div>
</section>`;
}

function insurance(page) {
  const promo = PROMO.enabled ? `
    <div class="promo-callout only-storm reveal">
      <span class="offer-badge">Current offer</span>
      <div>
        <strong>Class 4 shingle upgrade on qualifying insurance roofs${PROMO.endsText ? ` ${PROMO.endsText}` : ''}.</strong>
        On insurance-approved full roof replacements we install, we’re upgrading to Owens Corning® Duration FLEX® Class 4 impact-resistant shingles and registering the Owens Corning® Platinum Protection warranty at no added cost. Ask us whether your project qualifies.
      </div>
    </div>` : '';
  return `
<section class="section on-paper-2" id="insurance">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow reveal">Storm damage &amp; insurance restoration</div>
      <h2 class="section-title reveal">Dealing with storm damage? <span class="gold-text-dark">We know the process.</span></h2>
      <p class="section-sub reveal">Hail and wind are part of living on the Front Range, and insurance restoration is a big part of what we do. We’re not adjusters and we don’t decide coverage. Our job is to make sure the damage is documented properly, the estimate reflects the work your home actually needs, and the restoration gets done right.</p>
    </div>
    <div class="steps-grid steps-4">
      <div class="step-card reveal">
        <div class="step-num"><span class="big">01</span> Inspect</div>
        <h3>Find and document the damage</h3>
        <p>We get on the roof and around the house and photograph what we find: roof, gutters, siding, paint, and screens.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num"><span class="big">02</span> Explain</div>
        <h3>Walk you through it</h3>
        <p>We show you what we found and whether it’s worth a claim, and explain how the process works and where we fit in. If it isn’t worth filing, we’ll tell you.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num"><span class="big">03</span> Review</div>
        <h3>Check the insurance estimate</h3>
        <p>We compare your carrier’s estimate to what the repair actually takes, meet the adjuster when it helps, and send documentation for anything that was missed.</p>
      </div>
      <div class="step-card reveal">
        <div class="step-num"><span class="big">04</span> Restore</div>
        <h3>Do the work right</h3>
        <p>We complete the approved repairs with a project supervisor on site, keep you updated as we go, and clean up when we’re done.</p>
      </div>
    </div>
    ${promo}
    <div class="insurance-cta reveal">
      <a href="#book" class="btn btn-primary">${I.calendar} Book a Storm Damage Inspection</a>
      <span class="insurance-note">Free, no obligation. Photos of everything we find.</span>
    </div>
  </div>
</section>`;
}

function why(page) {
  return `
<section class="section on-dark why">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow reveal">Why homeowners choose Ideal</div>
      <h2 class="section-title reveal silver-text">A local team that’s still here after the job’s done.</h2>
      <p class="section-sub reveal">We’ve built our reputation one house at a time across Denver and Boulder. Here’s what that looks like on your property.</p>
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
          <strong>Every tear-off, wrapped.</strong> Debris and nails land in the net, not your landscaping, siding, windows, or AC unit.
        </figcaption>
        <span class="why-photo-badge">Real Ideal job site · Denver, CO</span>
      </figure>

      <ul class="why-list">
        <li class="why-item reveal">
          <div class="why-icon">${I.family}</div>
          <div class="why-body">
            <h3>Family-run and local</h3>
            <p>Ideal is owned by Jake Fairbanks, who runs it alongside his sister Christina, who handles production and operations. We’re based in Wheat Ridge, and our name is on every job.</p>
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.checkCircle}</div>
          <div class="why-body">
            <h3>Honest recommendations</h3>
            <p>If a repair will do, we’ll tell you. If your roof has years left, we’ll tell you that too. A lot of our reviews come from homeowners we talked out of work they didn’t need.</p>
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.person}</div>
          <div class="why-body">
            <h3>A supervisor on site, and clear communication</h3>
            <p>Someone from our team is on your property while the work is happening. You’ll know who to call, what’s next, and when we’ll be there.</p>
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.shield}</div>
          <div class="why-body">
            <h3>Owens Corning Platinum Preferred</h3>
            <p>Owens Corning’s top contractor tier, earned by about 1% of roofers nationwide. It means your roof goes on to manufacturer spec, and it lets us offer Owens Corning’s strongest system warranties on eligible roofs.</p>
            <img class="why-oc" loading="lazy" alt="Owens Corning Platinum Preferred Contractor" src="${SITE.ocPlatinumLogo}">
          </div>
        </li>
        <li class="why-item reveal">
          <div class="why-icon">${I.house}</div>
          <div class="why-body">
            <h3>Respect for your property</h3>
            <p>Before the first shingle comes off, we wrap the house in our catch-all system, like the one in the photo. When we leave, we sweep for nails and clean up.</p>
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
      <div class="eyebrow center reveal">Schedule a free inspection</div>
      <h2 class="section-title reveal">Pick a time. We’ll come take a look.</h2>
      <p class="section-sub reveal">Whether it’s an aging roof, a siding or paint project, a repair, or storm damage, start here. We’ll look over your home, answer your questions, and give you a straight recommendation.</p>
    </div>
    <div class="booking-card reveal">
      <div class="calendly-inline-widget" data-url="${SITE.calendlyUrl}" style="min-width:320px;height:700px;"></div>
      <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
    </div>
    <div class="book-note">
      <span>${I.clock}Takes about a minute to book</span>
      <span>${I.checkCircle}No obligation, no pressure</span>
      <span>${I.shield}Photos of what we find</span>
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
        <div class="eyebrow">Prefer to talk first?</div>
        <h2>Request a call.</h2>
        <p>Leave your name and number and we’ll call you within one business hour to talk through your project and find a time that works.</p>
        <ul>
          <li>${I.check}Free inspections and estimates</li>
          <li>${I.check}Roofing, siding, painting, and gutters</li>
          <li>${I.check}Experienced with insurance restoration</li>
          <li>${I.check}Local team, based in Wheat Ridge</li>
        </ul>
      </div>
      <form class="lead-form" id="lead-form" action="${SITE.webhookUrl}" method="POST">
        <div class="form-row">
          <label><span class="label-text">First name</span><input name="first_name" type="text" autocomplete="given-name" placeholder="Jane" required></label>
          <label><span class="label-text">Last name</span><input name="last_name" type="text" autocomplete="family-name" placeholder="Smith" required></label>
        </div>
        <label><span class="label-text">Phone number</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(303) 555-0123" required></label>
        <input type="hidden" name="lead_source" value="Meta Ads">
        <input type="hidden" name="lead_type" id="lead_type" value="${esc(page.campaign === 'storm' ? page.leadType : page.leadType)}" data-general="${esc(page.leadType)}" data-storm="${esc(page.leadTypeStorm || page.leadType)}">
        <input type="hidden" name="source_detail" value="${page.sourceDetail}">
        <input type="hidden" name="page_mode" id="page_mode" value="${page.campaign}">
        <input type="hidden" name="offer" id="offer" value="${page.campaign === 'storm' && PROMO.enabled ? esc(PROMO.hiddenValue) : ''}" data-storm="${PROMO.enabled ? esc(PROMO.hiddenValue) : ''}">
        <input type="hidden" name="utm_source" id="utm_source" value="">
        <input type="hidden" name="utm_campaign" id="utm_campaign" value="">
        <input type="hidden" name="utm_creative" id="utm_creative" value="">
        <button type="submit">Request a Call →</button>
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
      <div class="eyebrow reveal">Meet the team</div>
      <h2 class="section-title reveal">The people you’ll actually work with.</h2>
      <p class="section-sub reveal">Ideal is family-run and locally operated. Jake owns the company, Christina runs production and operations, and the same small team stays with your project from the first visit to the final walkthrough.</p>
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
  const card = ([name, label, text]) => `
        <figure class="rv-card">
          <div class="rv-top"><span class="rv-stars" aria-label="5 stars">★★★★★</span>${I.google}</div>
          <span class="rv-tag">${label}</span>
          <p>${text}</p>
          <figcaption><span class="rv-av" aria-hidden="true">${name[0]}</span>${name}<span class="rv-src">· Google</span></figcaption>
        </figure>`;
  const cols = [REVIEWS.slice(0, 5), REVIEWS.slice(5, 10), REVIEWS.slice(10, 15)];
  return `
<section class="section reviews">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">Reviews from local homeowners</div>
      <h2 class="section-title reveal silver-text">Roofs, siding, paint, gutters.<br><span class="gold-text">Same five-star experience.</span></h2>
      <div class="rv-meta reveal"><span class="rv-stars-xl" aria-hidden="true">★★★★★</span><span><strong>${SITE.reviewScore}</strong> on Google · <strong>${SITE.reviewCount}</strong> reviews</span><a class="rv-link" href="${SITE.googleMaps}" target="_blank" rel="noopener noreferrer">Read them all on Google →</a></div>
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
    ['What areas do you serve?', 'Denver Metro and Boulder, from our office in Wheat Ridge. That includes Denver, Lakewood, Arvada, Westminster, Broomfield, Thornton, Aurora, Centennial, Littleton, Highlands Ranch, Parker, Boulder, Longmont, and the communities in between. If you’re not sure, give us a call.'],
    ['Do you handle smaller repairs, or only full replacements?', 'Both. We do plenty of leak repairs, partial roof replacements, siding sections, trim work, and gutter fixes. If a repair is the right call, that’s what we’ll recommend.'],
    ['Are your inspections and estimates really free?', 'Yes. We’ll look over your home, take photos of anything we find, and give you a straight recommendation and estimate. There’s no obligation.'],
    ['Can you help if my project involves an insurance claim?', 'Yes. Insurance restoration is a big part of what we do. We document the damage, can meet your adjuster on-site, review the carrier’s estimate against what the repair actually takes, and send documentation for anything that was missed. Coverage decisions are up to your insurance company, and we can’t guarantee a claim will be approved, but we’ll make sure your home is represented accurately.'],
    ['What types of roofing and siding do you install?', 'For roofs: Owens Corning® asphalt shingles (including Class 4 impact-resistant options), standing seam metal, and synthetic shake and slate. For siding: James Hardie® fiber cement and LP® SmartSide®. We also install seamless aluminum gutters and handle exterior painting.'],
    ['What makes your roofing warranties different?', 'As an Owens Corning Platinum Preferred Contractor, we can offer Owens Corning’s strongest system warranties on eligible roofs, including the Platinum Protection Limited Warranty. It covers materials and includes manufacturer-backed workmanship coverage, so it doesn’t depend only on the contractor. Coverage and eligibility depend on the products installed, so we’ll go over exactly what applies to your roof.'],
  ];
  return `
<section class="section on-paper">
  <div class="container">
    <div class="section-head center">
      <div class="eyebrow center reveal">Straight answers</div>
      <h2 class="section-title reveal">Questions homeowners ask us.</h2>
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
      <div class="eyebrow center">Free inspections · Denver Metro &amp; Boulder</div>
      <h2 class="silver-text">Your home deserves a contractor you can count on.</h2>
      <p>Whether you’re planning an exterior project, dealing with an aging roof, or sorting out storm damage, we’ll help you understand your options and figure out the next step.</p>
      <div class="cta-row">
        <a href="#book" class="btn btn-primary btn-lg">${I.calendar} Schedule a Free Inspection</a>
        <a href="${SITE.phoneHref}" class="btn btn-ghost btn-lg" data-event="Contact">${I.phone} Call ${SITE.phoneDisplay}</a>
      </div>
    </div>
  </div>
</section>`;
}

function footer() {
  const promoLegal = PROMO.enabled
    ? ` <span class="only-storm">Upgrade offer applies to qualifying insurance-approved full roof replacements installed by ${SITE.brand}${PROMO.endsText ? `, ${PROMO.endsText}` : ''}; ask us about eligibility.</span>`
    : '';
  return `
<footer>
  <div class="container foot-grid">
    <a class="foot-logo" href="https://myidealpros.com" target="_blank" rel="noopener"><img src="/assets/logo-light.svg" alt="${SITE.brand}" width="190" height="92"></a>
    <div>
      <div class="foot-main">${SITE.brand} · 4175 Harlan St #140, Wheat Ridge, CO 80033 · <a href="${SITE.phoneHref}" data-event="Contact">${SITE.phoneDisplay}</a> · <a href="https://myidealpros.com" target="_blank" rel="noopener">myidealpros.com</a></div>
      <div class="foot-links">
        <a href="https://myidealpros.com/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>
        <a href="https://myidealpros.com/terms-and-conditions" target="_blank" rel="noopener">Terms &amp; Conditions</a>
      </div>
      <div class="foot-legal">Owens Corning Platinum Preferred Contractor · Licensed &amp; insured. We are a roofing and exterior contractor, not a public adjuster or law firm. Insurance coverage decisions are made by your carrier, and you are free to choose your own contractor. Warranty coverage depends on the products installed and registration; see the Owens Corning® Platinum Protection Limited Warranty for complete terms.${promoLegal} Owens Corning®, Duration FLEX®, TruDefinition® and SureNail® are trademarks of Owens Corning. James Hardie® and LP® SmartSide® are trademarks of their respective owners.</div>
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
  const cfg = {
    town: page.town,
    campaign: page.campaign,
    stormVariants: STORM_VARIANTS,
    variants: variantsFor(page),
    gtagLeadLabel: SITE.gtagLeadLabel,
    gtagScheduleLabel: SITE.gtagScheduleLabel,
    gtagContactLabel: SITE.gtagContactLabel,
  };
  return `
<script>window.PAGE = ${JSON.stringify(cfg)};</script>
<script src="https://player.vimeo.com/api/player.js" defer></script>
<script src="/assets/site.js?v=${JS_V}" defer></script>
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────────────────────
function render(page) {
  return [
    head(page), urgency(page), header(page), hero(page), services(page), why(page), insurance(page),
    booking(), leadForm(page), team(), reviews(), faq(), finalCta(page), footer(), scripts(page),
  ].join('\n');
}

for (const page of PAGES) {
  const out = path.join(__dirname, page.file);
  fs.writeFileSync(out, render(page));
  console.log(`✓ ${page.file} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}
