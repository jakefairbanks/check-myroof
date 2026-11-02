# check-myroof.com

Storm / insurance-claim landing pages for Ideal Roof & Exterior Pros. Static HTML on Vercel.

## Editing

Everything is generated from `build.js` + `assets/`:

```
node build.js        # regenerates index.html, inspection.html and the town pages
```

- **Copy, offers, team, reviews, tracking IDs** → `build.js` (top of file: `SITE`, `TEAM`, `REVIEWS`, `PAGES`)
- **Design system** → `assets/site.css` (brand tokens at the top: charcoal/silver/gold from the Ideal brand kit)
- **Behavior** (UTM headline variants, Pixel events, Zapier form) → `assets/site.js`
- **Logos** → `assets/logo-light.svg` (dark backgrounds) / `assets/logo-dark.svg` (light backgrounds)

### Add a town page

Add one line to `PAGES` in `build.js`:

```js
townPage('Castle Rock', 'castlerock'),
```

Run `node build.js`, commit `castlerock.html`. Vercel's `cleanUrls` serves it at `/castlerock`.

### Headline variants

Append `?v=hail | wind | deductible | storm-just-hit | denied` to any page URL to swap the hero copy (town-aware).

### Tracking

- Meta Pixel ID lives in `SITE.metaPixelId`. Events: `PageView`, `Lead` (form), `Schedule` (Calendly), `Contact` (tap-to-call).
- Google Ads: set `SITE.gtagId` (and the three conversion labels) to enable; `null` omits the tag entirely.
- Leads POST to the Zapier catch hook in `SITE.webhookUrl` → JobNimbus. Hidden fields: `lead_source`, `lead_type`, `source_detail`, `offer`, `utm_*`.
